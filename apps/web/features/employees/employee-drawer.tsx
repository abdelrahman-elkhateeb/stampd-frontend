"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { Controller, useForm, type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import {
  CheckboxField,
  SelectField,
  TextField,
  useFieldError,
} from "@/components/form-fields"
import { DateField } from "@/components/pickers"
import type { Role } from "@/lib/demo-user"
import { codeErrorMap } from "@/lib/forms"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { PersonCombobox } from "@workspace/ui/components/person-combobox"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { notify } from "@workspace/ui/components/sonner"

import type { Employee } from "./demo-data"
import { change, updateStore, useEmployeesStore } from "./store"

const ROLES = ["employee", "manager", "admin"] as const satisfies Role[]
const NONE = "none"

const EmployeeBody = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  jobTitle: z.string().trim().min(2).max(80),
  code: z.string().trim().max(20),
  departmentId: z.string(),
  managerId: z.string(),
  role: z.enum(ROLES),
  joinedOn: z.string().min(1),
  sendInvite: z.boolean(),
})
type EmployeeInput = z.infer<typeof EmployeeBody>

/** Add (editing = "new") or edit an employee in a drawer (drawer.md: forms on desktop). */
export function EmployeeDrawer({
  editing,
  onClose,
}: {
  editing: Employee | "new" | null
  onClose: () => void
}) {
  const t = useTranslations("employees.form")
  const tAll = useTranslations()
  const { employees, departments } = useEmployeesStore()
  const existing = editing !== null && editing !== "new" ? editing : null
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(EmployeeBody, codeErrorMap),
    mode: "onTouched",
    defaultValues: existing
      ? {
          ...existing,
          departmentId: existing.departmentId ?? NONE,
          managerId: existing.managerId ?? NONE,
          sendInvite: false,
        }
      : {
          name: "",
          email: "",
          jobTitle: "",
          code: "",
          departmentId: NONE,
          managerId: NONE,
          role: "employee",
          joinedOn: "",
          sendInvite: true,
        },
  })
  const joinedError = useFieldError(form, "joinedOn", "employee-joined")

  function close() {
    if (form.formState.isDirty) setConfirmDiscard(true)
    else onClose()
  }

  const onSubmit = form.handleSubmit((body) => {
    const email = body.email.toLowerCase()
    if (
      employees.some(
        (employee) =>
          employee.id !== existing?.id && employee.email.toLowerCase() === email
      )
    ) {
      form.setError("email", { message: "EMAIL_TAKEN" })
      return
    }
    const departmentId = body.departmentId === NONE ? null : body.departmentId
    const managerId = body.managerId === NONE ? null : body.managerId
    const next: Employee = {
      ...(existing ?? {
        id: crypto.randomUUID(),
        status: "invited",
        pendingRequests: 0,
        upcomingLeaveDays: 0,
      }),
      name: body.name.trim(),
      email,
      jobTitle: body.jobTitle.trim(),
      code: body.code.trim(),
      departmentId,
      managerId,
      role: body.role,
      joinedOn: body.joinedOn as PlainDate,
    }
    const nameOf = (id: string | null, list: { id: string; name: string }[]) =>
      list.find((item) => item.id === id)?.name ?? "–"
    const fields = existing
      ? [
          ["name", existing.name, next.name],
          ["email", existing.email, next.email],
          ["jobTitle", existing.jobTitle, next.jobTitle],
          ["code", existing.code, next.code],
          [
            "department",
            nameOf(existing.departmentId, departments),
            nameOf(departmentId, departments),
          ],
          [
            "manager",
            nameOf(existing.managerId, employees),
            nameOf(managerId, employees),
          ],
          ["role", existing.role, next.role],
          ["joinedOn", existing.joinedOn, next.joinedOn],
        ]
          .filter(([, from, to]) => from !== to)
          .map(([field, from, to]) => ({ field: field!, from: from!, to: to! }))
      : []
    updateStore((current) => ({
      ...current,
      employees: existing
        ? current.employees.map((employee) =>
            employee.id === next.id ? next : employee
          )
        : [...current.employees, next],
      history: [
        ...current.history,
        ...(existing && fields.length
          ? [change(next.id, "updated", fields)]
          : []),
        ...(existing ? [] : [change(next.id, "created")]),
        ...(!existing && body.sendInvite
          ? [change(next.id, "inviteSent")]
          : []),
      ],
    }))
    notify.success(
      t(existing ? "updated" : body.sendInvite ? "invited" : "created", {
        name: next.name,
      })
    )
    onClose()
  })

  return (
    <>
      <Sheet open={editing !== null} onOpenChange={(open) => !open && close()}>
        <SheetContent closeLabel={tAll("common.close")}>
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetHeader>
              <div className="flex flex-col gap-1">
                <SheetTitle>
                  {existing
                    ? t("editTitle", { name: existing.name })
                    : t("addTitle")}
                </SheetTitle>
                <SheetDescription>
                  {t(existing ? "editDescription" : "addDescription")}
                </SheetDescription>
              </div>
            </SheetHeader>
            <SheetBody>
              <FieldGroup>
                <TextField
                  form={form}
                  name="name"
                  label={t("name")}
                  autoComplete="off"
                />
                <TextField
                  form={form}
                  name="email"
                  type="email"
                  label={t("email")}
                  description={existing ? undefined : t("emailHint")}
                  autoComplete="off"
                />
                <TextField form={form} name="jobTitle" label={t("jobTitle")} />
                <SelectField
                  form={form}
                  name="departmentId"
                  label={t("department")}
                  options={[
                    ...departments.map((department) => ({
                      value: department.id,
                      label: department.name,
                    })),
                    { value: NONE, label: tAll("employees.noDepartment") },
                  ]}
                />
                <ManagerField
                  form={form}
                  label={t("manager")}
                  candidates={employees.filter(
                    (employee) =>
                      employee.id !== existing?.id &&
                      employee.status !== "deactivated"
                  )}
                />
                <SelectField
                  form={form}
                  name="role"
                  label={t("role")}
                  options={ROLES.map((role) => ({
                    value: role,
                    label: tAll(`employees.roles.${role}`),
                  }))}
                />
                <Controller
                  control={form.control}
                  name="joinedOn"
                  render={({ field }) => (
                    <DateField
                      label={t("joinedOn")}
                      value={(field.value as PlainDate) || null}
                      onChange={(value) => {
                        field.onChange(value ?? "")
                        field.onBlur()
                      }}
                      error={joinedError?.text}
                    />
                  )}
                />
                <TextField
                  form={form}
                  name="code"
                  label={t("code")}
                  description={t("codeHint")}
                />
                {existing ? null : (
                  <CheckboxField
                    form={form}
                    name="sendInvite"
                    label={t("sendInvite")}
                  />
                )}
              </FieldGroup>
            </SheetBody>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={close}>
                {tAll("common.cancel")}
              </Button>
              <Button type="submit">
                {t(existing ? "saveEdit" : "saveNew")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        variant="neutral"
        title={tAll("unsavedChanges.title")}
        description={tAll("unsavedChanges.description")}
        cancelLabel={tAll("unsavedChanges.keep")}
        confirmLabel={tAll("unsavedChanges.discard")}
        onConfirm={onClose}
      />
    </>
  )
}

/** The manager combobox (select.md › combobox: people pickers search). */
function ManagerField({
  form,
  label,
  candidates,
}: {
  form: UseFormReturn<EmployeeInput>
  label: string
  candidates: Employee[]
}) {
  const t = useTranslations("employees.form")
  const id = useId()
  const error = useFieldError(form, "managerId", id)

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        control={form.control}
        name="managerId"
        render={({ field }) => (
          <PersonCombobox
            ref={field.ref}
            id={id}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            people={candidates.map((candidate) => ({
              id: candidate.id,
              name: candidate.name,
              detail: candidate.jobTitle,
            }))}
            noneValue={NONE}
            placeholder={t("noManager")}
            searchPlaceholder={t("managerSearch")}
            emptyText={t("managerEmpty")}
            invalid={Boolean(error)}
            describedBy={error?.id}
          />
        )}
      />
      {error ? <FieldError id={error.id}>{error.text}</FieldError> : null}
    </Field>
  )
}
