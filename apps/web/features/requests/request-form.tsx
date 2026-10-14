"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { InfoIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"
import {
  Controller,
  useForm,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form"

import { ReasonField, SelectField, TextField } from "@/components/form-fields"
import { DateField, DateRangeField, TimeField } from "@/components/pickers"
import { useUser } from "@/components/user-provider"
import { useRouter } from "@/i18n/navigation"
import { codeErrorMap, showProblem } from "@/lib/forms"
import { isPlainDate } from "@/lib/format"
import { Button } from "@workspace/ui/components/button"
import { CategoryChip } from "@workspace/ui/components/category-chip"
import { Checkbox } from "@workspace/ui/components/checkbox"
import type { DateRangeValue } from "@workspace/ui/components/date-picker"
import { ErrorState } from "@workspace/ui/components/error-state"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { PersonCombobox } from "@workspace/ui/components/person-combobox"
import { notify } from "@workspace/ui/components/sonner"

import { submitRequest } from "./actions"
import type { EmployeeOption, RequestType, TypeField } from "./request-data"
import { categoryOf, useRequestText } from "./request-text"
import {
  buildSchema,
  datesField,
  formFieldNames,
  initialValues,
  isLongText,
  toRequestBody,
  unsupportedFields,
  type RequestFormValues,
} from "./rules"

type Form = UseFormReturn<RequestFormValues>

/** Problems with no field that the form explains itself; anything else is "couldn't send". */
const FORM_ERRORS = ["REQUEST_TYPE_DISABLED"]

/** patterns/request-form-renderer.md: one form for every request type, from its metadata. */
export function RequestForm({
  type,
  employees,
}: {
  type: RequestType
  /** Admins only: who they can file for. */
  employees?: EmployeeOption[]
}) {
  const t = useTranslations("requests.form")
  const text = useRequestText({ types: [type], leaveTypes: [] })
  const unsupported = unsupportedFields(type)

  useEffect(() => {
    if (unsupported.length)
      console.error(
        `Request type "${type.key}" has unsupported fields:`,
        unsupported.map((field) => `${field.name} (${field.kind})`)
      )
  }, [type.key, unsupported])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <CategoryChip
          category={categoryOf(type.key)}
          label={text.typeLabel(type.key)}
        />
        <h1 className="text-h2 font-bold">{text.typeLabel(type.key)}</h1>
        <p className="-mt-2 text-muted-foreground">
          {text.typeDescription(type.key)}
        </p>
        {type.approverPolicy === "ADMIN_ONLY" ? (
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
        <FormBody type={type} employees={employees} />
      )}
    </div>
  )
}

function FormBody({
  type,
  employees,
}: {
  type: RequestType
  employees?: EmployeeOption[]
}) {
  const t = useTranslations("requests.form")
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useUser()
  const [onBehalf, setOnBehalf] = useState(user.id)
  const [recordApproved, setRecordApproved] = useState(false)
  const forSomeoneElse = onBehalf !== user.id

  // ?date= prefills the day, e.g. from a missed check-out (FE-06).
  const date = searchParams.get("date")
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(
      buildSchema(type),
      codeErrorMap
    ) as unknown as Resolver<RequestFormValues>,
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: initialValues(type, date && isPlainDate(date) ? date : null),
  })
  const rootCode = form.formState.errors.root?.message
  const label = useLabels()

  const onSubmit = form.handleSubmit(async (values) => {
    const approved = forSomeoneElse && recordApproved
    const result = await submitRequest({
      ...toRequestBody(type, values),
      ...(forSomeoneElse && { employeeId: onBehalf, approved }),
    })
    if ("id" in result) {
      notify.success(t(approved ? "recorded" : "sent"))
      router.push(`/requests/${result.id}`)
      return
    }
    // Overlaps carry no field: they belong under the dates.
    if (result.problem.code === "REQUEST_OVERLAP")
      form.setError(
        datesField(type),
        { message: "REQUEST_OVERLAP" },
        { shouldFocus: true }
      )
    else showProblem(form, result.problem, formFieldNames(type))
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
      {employees ? (
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
            people={employees.map((item) => ({
              id: item.id,
              name:
                item.id === user.id ? t("me", { name: item.name }) : item.name,
              detail: item.jobTitle ?? undefined,
            }))}
          />
          {/* The API records only someone else's request as approved. */}
          {forSomeoneElse ? (
            <Field orientation="horizontal">
              <Checkbox
                id="record-approved"
                checked={recordApproved}
                onCheckedChange={(checked) =>
                  setRecordApproved(checked === true)
                }
              />
              <FieldLabel htmlFor="record-approved" className="font-normal">
                {t("recordApproved")}
              </FieldLabel>
            </Field>
          ) : null}
        </section>
      ) : null}

      <FieldGroup>
        <DatesFields form={form} type={type} />
        {type.fields.map((field) => (
          <RequestField key={field.name} form={form} field={field} />
        ))}
        <ReasonField
          form={form}
          name="reason"
          label={label("reason", type.reason === "REQUIRED")}
          maxLength={1000}
          description={t("reasonHint")}
        />
      </FieldGroup>

      {rootCode ? (
        <ErrorState
          variant="inline"
          title={t(
            FORM_ERRORS.includes(rootCode)
              ? `errors.${rootCode as "REQUEST_TYPE_DISABLED"}`
              : "failed"
          )}
        />
      ) : null}

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

/** label("destination", true) → "Destination"; label("reason", false) → "Reason (optional)". */
function useLabels() {
  const t = useTranslations("requests.form")
  const { fieldLabel } = useRequestText({ types: [], leaveTypes: [] })
  return (name: string, required: boolean) =>
    required ? fieldLabel(name) : t("optional", { label: fieldLabel(name) })
}

/** error("dates") → the field's error code, translated (messages › fieldErrors). */
function useErrors(form: Form) {
  const t = useTranslations("fieldErrors")
  return (name: string) => {
    const code = form.formState.errors[name]?.message
    if (typeof code !== "string") return undefined
    return t.has(code as never) ? t(code as never) : t("INVALID_FORMAT")
  }
}

/** The day or range, then the time window when the type has one. */
function DatesFields({ form, type }: { form: Form; type: RequestType }) {
  const timesRequired = type.times === "REQUIRED"
  const label = useLabels()
  const error = useErrors(form)

  return (
    <>
      {type.dates === "RANGE" ? (
        <Controller
          control={form.control}
          name="dates"
          render={({ field: input }) => (
            <DateRangeField
              label={label("dates", true)}
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
              error={error("dates")}
            />
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name="startDate"
          render={({ field: input }) => (
            <DateField
              label={label("day", true)}
              value={(input.value as string) || null}
              onChange={(value) => {
                input.onChange(value ?? "")
                input.onBlur()
              }}
              error={error("startDate")}
            />
          )}
        />
      )}
      {type.times !== "NONE" ? (
        <>
          {(["startTime", "endTime"] as const).map((name) => (
            <TimeInput
              key={name}
              form={form}
              name={name}
              label={label(name, timesRequired)}
              error={error(name)}
            />
          ))}
        </>
      ) : null}
    </>
  )
}

function TimeInput({
  form,
  name,
  label,
  error,
}: {
  form: Form
  name: string
  label: string
  error?: string
}) {
  return (
    <Controller
      control={form.control}
      name={name}
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
}

/** One type field → its component (request-form-renderer.md › Field type → component). */
function RequestField({ form, field }: { form: Form; field: TypeField }) {
  const t = useTranslations()
  const text = useRequestText({ types: [], leaveTypes: [] })
  const label = useLabels()(field.name, field.required)
  const error = useErrors(form)(field.name)

  switch (field.kind) {
    case "time":
      return (
        <TimeInput form={form} name={field.name} label={label} error={error} />
      )
    case "choice":
      return (
        <SelectField
          form={form}
          name={field.name}
          label={label}
          placeholder={t("common.choose")}
          options={(field.options ?? []).map((option) => ({
            value: option,
            label: text.value(field, option) ?? option,
          }))}
        />
      )
    default:
      return isLongText(field) ? (
        <ReasonField
          form={form}
          name={field.name}
          label={label}
          maxLength={field.maxLength}
        />
      ) : (
        <TextField
          form={form}
          name={field.name}
          label={label}
          maxLength={field.maxLength}
        />
      )
  }
}
