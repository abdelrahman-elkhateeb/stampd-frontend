"use client"

import { ar as dateFnsAr, enGB as dateFnsEnGb } from "date-fns/locale"
import { useLocale, useTranslations } from "next-intl"
import { useId } from "react"

import { DEMO_USER } from "@/lib/demo-user"
import { useFormat } from "@/lib/use-format"
import {
  DatePicker,
  DateRangePicker,
  type DateRangeValue,
  type Holiday,
  type PlainDate,
} from "@workspace/ui/components/date-picker"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { TimeInput } from "@workspace/ui/components/time-input"

/** Week start, working days and month names from the company and the user's language. */
function useCompanyCalendar(holidays?: Holiday[]) {
  const locale = useLocale()
  return {
    weekStartsOn: DEMO_USER.company.weekStart,
    workingDays: DEMO_USER.company.workingDays,
    holidays,
    locale: locale === "ar" ? dateFnsAr : dateFnsEnGb,
  }
}

type FieldProps = {
  label: string
  description?: string
  error?: string
  disabled?: boolean
}

export function DateField({
  label,
  description,
  error,
  disabled,
  value,
  onChange,
  min,
  max,
  holidays,
}: FieldProps & {
  value: PlainDate | null
  onChange: (value: PlainDate | null) => void
  min?: PlainDate
  max?: PlainDate
  holidays?: Holiday[]
}) {
  const t = useTranslations("datePicker")
  const format = useFormat()
  const calendar = useCompanyCalendar(holidays)
  const id = useId()

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DatePicker
        id={id}
        value={value}
        onChange={onChange}
        formatValue={(day) => format.day(day)}
        placeholder={t("placeholder")}
        min={min}
        max={max}
        invalid={Boolean(error)}
        describedBy={
          error ? `${id}-error` : description ? `${id}-description` : undefined
        }
        disabled={disabled}
        {...calendar}
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  )
}

export function DateRangeField({
  label,
  description,
  error,
  disabled,
  value,
  onChange,
  holidays,
  summary,
}: FieldProps & {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  holidays?: Holiday[]
  summary?: React.ReactNode
}) {
  const t = useTranslations("datePicker")
  const format = useFormat()
  const calendar = useCompanyCalendar(holidays)
  const id = useId()

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DateRangePicker
        id={id}
        value={value}
        onChange={onChange}
        formatValue={(from, to) => format.dayRange(from, to)}
        placeholder={t("rangePlaceholder")}
        summary={summary}
        invalid={Boolean(error)}
        describedBy={error ? `${id}-error` : undefined}
        disabled={disabled}
        {...calendar}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  )
}

export function TimeField({
  label,
  error,
  disabled,
  value,
  onChange,
  zoneLabel,
}: FieldProps & {
  value: string | null
  onChange: (value: string | null) => void
  zoneLabel?: string
}) {
  const t = useTranslations("time")
  const id = useId()

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel id={`${id}-label`}>{label}</FieldLabel>
      <TimeInput
        labelledBy={`${id}-label`}
        value={value}
        onChange={onChange}
        segmentLabels={{ hours: t("hours"), minutes: t("minutes") }}
        zoneLabel={zoneLabel}
        invalid={Boolean(error)}
        describedBy={`${id}-description${error ? ` ${id}-error` : ""}`}
        disabled={disabled}
      />
      <FieldDescription id={`${id}-description`}>
        {t("companyTime", { zone: DEMO_USER.company.timezone })}
      </FieldDescription>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  )
}
