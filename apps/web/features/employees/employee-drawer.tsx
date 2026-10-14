"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useId, useState } from "react"
import { Controller, useForm, type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { SelectField, TextField, useFieldError } from "@/components/form-fields"
import { DateField } from "@/components/pickers"
import type { Role } from "@/lib/user"
import { codeErrorMap, showProblem } from "@/lib/forms"
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

import { createEmployee, updateEmployee, type EmployeeBody } from "./actions"
import type { Department, Employee, PersonOption } from "./employee-data"

const ROLES = ["employee", "manager", "admin"] as const satisfies Role[]
const NONE = "none"

const EmployeeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  jobTitle: z.string().trim().max(100),
  code: z.string().trim().max(30),
  departmentId: z.string(),
  managerId: z.string(),
  role: z.enum(ROLES),
  joinedOn: z.string().min(1),
})
type EmployeeInput = z.infer<typeof EmployeeSchema>

/** Add (editing = "new") or edit an employee in a drawer (drawer.md: forms on desktop). */
/** API field names back to form fields, for field errors. */
const FORM_FIELDS = {
  employeeCode: "code",
  joiningDate: "joinedOn",
}

const toBody = (input: EmployeeInput): EmployeeBody => ({
  name: input.name.trim(),
  email: input.email.trim().toLowerCase(),
  jobTitle: input.jobTitle.trim() || null,
  employeeCode: input.code.trim() || null,
  departmentId: input.departmentId === NONE ? null : input.departmentId,
  managerId: input.managerId === NONE ? null : input.managerId,
  role: input.role.toUpperCase() as EmployeeBody["role"],
  joiningDate: input.joinedOn,
})

export function EmployeeDrawer({
  editing,
  departments,
  managers,
  onClose,
}: {
  editing: Employee | "new" | null
  departments: Department[]
  /** Active Managers and Admins. */
  managers: PersonOption[]
  onClose: () => void
}) {
  const t = useTranslations("employees.form")
  const tAll = useTranslations()
  const existing = editing !== null && editing !== "new" ? editing : null
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const form = useForm<EmployeeInput>({
    resolver: zodResolver(EmployeeSchema, codeErrorMap),
    mode: "onTouched",
    defaultValues: existing
      ? {
          name: existing.name,
          email: existing.email,
          jobTitle: existing.jobTitle,
          code: existing.code,
          role: existing.role,
          joinedOn: existing.joinedOn ?? "",
          departmentId: existing.department?.id ?? NONE,
          managerId: existing.manager?.id ?? NONE,
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
        },
  })
  const joinedError = useFieldError(form, "joinedOn", "employee-joined")

  function close() {
    if (form.formState.isDirty) setConfirmDiscard(true)
    else onClose()
  }

  const onSubmit = form.handleSubmit(async (input) => {
    const body = toBody(input)
    const before = existing
      ? toBody(form.formState.defaultValues as EmployeeInput)
      : null
    // Edits send only what changed (an unchanged role never trips LAST_ADMIN).
    const change = before
      ? Object.fromEntries(
          Object.entries(body).filter(
            ([key, value]) => before[key as keyof EmployeeBody] !== value
          )
        )
      : body
    const problem = existing
      ? await updateEmployee(existing.id, change)
      : await createEmployee(body)
    if (problem) {
      showProblem(form, problem, FORM_FIELDS)
      if (form.formState.errors.root)
        notify.error(
          tAll.has(`employees.errors.${problem.code}` as never)
            ? tAll(`employees.errors.${problem.code}` as never)
            : t("failed")
        )
      return
    }
    notify.success(t(existing ? "updated" : "invited", { name: body.name }))
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
                  candidates={managers.filter(
                    (manager) => manager.id !== existing?.id
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
              </FieldGroup>
            </SheetBody>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={close}>
                {tAll("common.cancel")}
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
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
  candidates: PersonOption[]
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
