"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { InfoIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"
import {
  Controller,
  useForm,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form"

import {
  CheckboxField,
  ReasonField,
  SelectField,
  StepperField,
  TextField,
} from "@/components/form-fields"
import { DateField, DateRangeField, TimeField } from "@/components/pickers"
import { useEmployeesStore } from "@/features/employees/store"
import { useRouter } from "@/i18n/navigation"
import { DEMO_USER } from "@/lib/demo-user"
import { codeErrorMap } from "@/lib/forms"
import { isPlainDate } from "@/lib/format"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { CategoryChip } from "@workspace/ui/components/category-chip"
import { Checkbox } from "@workspace/ui/components/checkbox"
import type { DateRangeValue } from "@workspace/ui/components/date-picker"
import { ErrorState } from "@workspace/ui/components/error-state"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { PersonCombobox } from "@workspace/ui/components/person-combobox"
import { notify } from "@workspace/ui/components/sonner"

import {
  DEMO_REQUEST_TYPES,
  type FieldMeta,
  type FieldValue,
  type RequestTypeMeta,
} from "./demo-data"
import {
  localize,
  buildSchema,
  findLeaveConflict,
  initialValues,
  unsupportedFields,
  type RequestFormValues,
} from "./rules"
import { submitRequest, today, useRequests } from "./store"

type Form = UseFormReturn<RequestFormValues>

// ponytail: demo labels until step 2 moves the form onto GET /requests/types.
export function useDemoText() {
  const locale = useLocale()
  return {
    text: (value: Parameters<typeof localize>[0]) => localize(value, locale),
  }
}

/** patterns/request-form-renderer.md: one form for every request type, from its metadata. */
export function RequestForm({ meta }: { meta: RequestTypeMeta }) {
  const t = useTranslations("requests.form")
  const text = useDemoText()
  const unsupported = unsupportedFields(meta)

  useEffect(() => {
    const fields = unsupportedFields(meta)
    if (fields.length)
      console.error(
        `Request type "${meta.key}" has unsupported fields:`,
        fields.map((field) => `${field.key} (${field.type})`)
      )
  }, [meta])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <CategoryChip category={meta.category} label={text.text(meta.label)} />
        <h1 className="text-h2 font-bold">{text.text(meta.label)}</h1>
        <p className="-mt-2 text-muted-foreground">
          {text.text(meta.description)}
        </p>
        {meta.approver === "hr" ? (
          <p className="flex w-fit items-center gap-2 rounded-md bg-info-bg px-3 py-2 text-body-sm text-info">
            <InfoIcon aria-hidden className="size-4 shrink-0" />
            {t("reviewedByHrNote")}
          </p>
        ) : null}
      </div>
      {unsupported.length ? (
        // Fail closed: no form, no submit.
        <ErrorState variant="inline" title={t("unsupported")} />
      ) : (
        <FormBody meta={meta} />
      )}
    </div>
  )
}

function FormBody({ meta }: { meta: RequestTypeMeta }) {
  const t = useTranslations("requests.form")
  const router = useRouter()
  const searchParams = useSearchParams()
  const requests = useRequests()
  const { employees } = useEmployeesStore()
  const admin = DEMO_USER.role === "admin"
  const [onBehalf, setOnBehalf] = useState(DEMO_USER.id)
  const [recordApproved, setRecordApproved] = useState(false)
  const [conflictDay, setConflictDay] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  // Known keys can be prefilled from the URL, e.g. ?date= from a missed check-out (FE-06).
  const prefill = Object.fromEntries(
    meta.fields
      .filter((field) => field.type === "date")
      .map((field) => [field.key, searchParams.get(field.key)])
      .filter((entry): entry is [string, string] =>
        Boolean(entry[1] && isPlainDate(entry[1]))
      )
  )
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(
      buildSchema(meta, { today: today(), admin }),
      codeErrorMap
    ) as unknown as Resolver<RequestFormValues>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: initialValues(meta, prefill),
  })

  const employee =
    onBehalf === DEMO_USER.id
      ? { id: DEMO_USER.id, name: DEMO_USER.name }
      : employees.find((item) => item.id === onBehalf)!

  function approverFor(employeeId: string) {
    if (meta.approver === "hr") return null
    if (employeeId === DEMO_USER.id) return DEMO_USER.manager
    const managerId = employees.find(
      (item) => item.id === employeeId
    )?.managerId
    return employees.find((item) => item.id === managerId)?.name ?? null
  }

  const onSubmit = form.handleSubmit(async (raw) => {
    setFailed(false)
    const values = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() || null : value,
      ])
    ) as Record<string, FieldValue>
    const conflict = findLeaveConflict(meta, values, {
      employeeId: employee.id,
      requests: requests ?? [],
      types: DEMO_REQUEST_TYPES,
    })
    if (conflict) {
      setConflictDay(conflict.day)
      form.setError(
        conflict.field,
        { message: "LEAVE_CONFLICT" },
        { shouldFocus: true }
      )
      return
    }
    try {
      const id = await submitRequest({
        type: meta.key,
        values,
        employee,
        approver: approverFor(employee.id),
        recordApproved: admin && recordApproved,
      })
      notify.success(t(recordApproved ? "recorded" : "sent"))
      router.push(`/requests/${id}`)
    } catch {
      setFailed(true)
    }
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {admin ? (
        <section
          aria-labelledby="on-behalf-title"
          className="flex flex-col gap-4 rounded-lg border bg-card p-4"
        >
          <h2 id="on-behalf-title" className="text-body-lg font-bold">
            {t("adminTitle")}
          </h2>
          <OnBehalfField
            value={onBehalf}
            onChange={setOnBehalf}
            people={employees
              .filter((item) => item.status === "active")
              .map((item) => ({
                id: item.id,
                name:
                  item.id === DEMO_USER.id
                    ? t("me", { name: item.name })
                    : item.name,
                detail: item.jobTitle,
              }))}
          />
          <Field orientation="horizontal">
            <Checkbox
              id="record-approved"
              checked={recordApproved}
              onCheckedChange={(checked) => setRecordApproved(checked === true)}
            />
            <FieldLabel htmlFor="record-approved" className="font-normal">
              {t("recordApproved")}
            </FieldLabel>
          </Field>
        </section>
      ) : null}

      <FieldGroup>
        {meta.fields.map((field) => (
          <RequestField
            key={field.key}
            form={form}
            field={field}
            admin={admin}
            conflictDay={conflictDay}
          />
        ))}
      </FieldGroup>

      {failed ? <ErrorState variant="inline" title={t("failed")} /> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/requests")}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          loadingLabel={t("submitting")}
        >
          {t("submit")}
        </Button>
      </div>
    </form>
  )
}

function OnBehalfField({
  value,
  onChange,
  people,
}: {
  value: string
  onChange: (id: string) => void
  people: { id: string; name: string; detail?: string }[]
}) {
  const t = useTranslations("requests.form")
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{t("onBehalf")}</FieldLabel>
      <PersonCombobox
        id={id}
        value={value}
        onChange={onChange}
        people={people}
        placeholder={t("onBehalf")}
        searchPlaceholder={t("onBehalfSearch")}
        emptyText={t("onBehalfEmpty")}
      />
    </Field>
  )
}

/** One metadata field → its component (request-form-renderer.md › Field type → component). */
function RequestField({
  form,
  field,
  admin,
  conflictDay,
}: {
  form: Form
  field: FieldMeta
  admin: boolean
  conflictDay: string | null
}) {
  const t = useTranslations()
  const format = useFormat()
  const text = useDemoText()
  const label = field.required
    ? text.text(field.label)
    : t("requests.form.optional", { label: text.text(field.label) })
  const code = form.formState.errors[field.key]?.message
  const error =
    typeof code !== "string"
      ? undefined
      : code === "LEAVE_CONFLICT" && conflictDay
        ? t("requests.form.leaveConflict", { day: format.day(conflictDay) })
        : t.has(`fieldErrors.${code}` as never)
          ? t(`fieldErrors.${code}` as never)
          : t("fieldErrors.INVALID_FORMAT")
  // Admins may file outside the usual dates (BE-10), so the pickers don't block them.
  const limits = admin
    ? {}
    : {
        min: field.notBefore === "today" ? today() : undefined,
        max: field.notAfter === "today" ? today() : undefined,
      }

  switch (field.type) {
    case "date":
      return (
        <Controller
          control={form.control}
          name={field.key}
          render={({ field: input }) => (
            <DateField
              label={label}
              value={(input.value as string) || null}
              onChange={(value) => {
                input.onChange(value ?? "")
                input.onBlur()
              }}
              error={error}
              {...limits}
            />
          )}
        />
      )
    case "date-range":
      return (
        <Controller
          control={form.control}
          name={field.key}
          render={({ field: input }) => (
            <DateRangeField
              label={label}
              value={
                (input.value as DateRangeValue | null) ?? {
                  from: null,
                  to: null,
                }
              }
              onChange={(value) => {
                input.onChange(value)
                if (value.to) input.onBlur()
              }}
              error={error}
            />
          )}
        />
      )
    case "time":
      return (
        <Controller
          control={form.control}
          name={field.key}
          render={({ field: input }) => (
            <TimeField
              label={label}
              value={(input.value as string) || null}
              onChange={(value) => {
                input.onChange(value ?? "")
                if (value) input.onBlur()
              }}
              error={error}
            />
          )}
        />
      )
    case "text":
      return (
        <TextField
          form={form}
          name={field.key}
          label={label}
          maxLength={field.maxLength}
        />
      )
    case "textarea":
      return (
        <ReasonField
          form={form}
          name={field.key}
          label={label}
          maxLength={field.maxLength}
          description={
            field.key === "reason" ? t("requests.form.reasonHint") : undefined
          }
        />
      )
    case "select":
      return (
        <SelectField
          form={form}
          name={field.key}
          label={label}
          placeholder={t("common.choose")}
          options={(field.options ?? []).map((option) => ({
            value: option.value,
            label: text.text(option.label),
          }))}
        />
      )
    case "number":
      return (
        <StepperField
          form={form}
          name={field.key}
          label={label}
          min={field.min}
          max={field.max}
        />
      )
    case "boolean":
      return <CheckboxField form={form} name={field.key} label={label} />
    default:
      return null
  }
}
