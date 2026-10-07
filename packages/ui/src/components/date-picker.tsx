"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { CalendarIcon } from "lucide-react"
import type { DateRange, Locale } from "react-day-picker"

import { Calendar } from "@workspace/ui/components/calendar"
import { inputClassName } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

// docs/design-system/components/date-picker.md + date-range-picker.md
// Values are plain calendar days ("YYYY-MM-DD"): no time, no zone, never shifted.

export type PlainDate = string
export type Holiday = { date: PlainDate; name: string }

/** 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

type CompanyCalendar = {
  /** From company settings; GCC default Sun–Thu. */
  workingDays: Weekday[]
  weekStartsOn: Weekday
  holidays?: Holiday[]
  /** date-fns locale for month and weekday names. */
  locale?: Partial<Locale>
}

function toDate(day: PlainDate): Date {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(year!, month! - 1, date)
}

function toPlain(date: Date): PlainDate {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function calendarModifiers({ workingDays, holidays = [] }: CompanyCalendar) {
  const holidayDates = new Set(holidays.map((holiday) => holiday.date))
  return {
    modifiers: {
      nonWorking: (date: Date) =>
        !workingDays.includes(date.getDay() as Weekday),
      holiday: (date: Date) => holidayDates.has(toPlain(date)),
    },
    modifiersClassNames: {
      nonWorking:
        "[&_button]:rounded-md [&_button]:bg-muted [&_button]:text-subtle-foreground",
      holiday:
        "[&_button]:underline [&_button]:decoration-status-holiday [&_button]:decoration-[3px] [&_button]:underline-offset-4",
    },
  }
}

function FieldButton({
  id,
  invalid,
  describedBy,
  placeholder,
  text,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  invalid?: boolean
  describedBy?: string
  placeholder: string
  text?: string
}) {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        inputClassName,
        "flex items-center justify-between gap-2 text-start",
        !text && "text-muted-foreground"
      )}
      {...props}
    >
      <span className="truncate">{text ?? placeholder}</span>
      <CalendarIcon
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
    </button>
  )
}

type DatePickerProps = CompanyCalendar & {
  id?: string
  value: PlainDate | null
  onChange: (value: PlainDate | null) => void
  /** Formats the chosen day for the field (pass the app's Intl formatter). */
  formatValue: (day: PlainDate) => string
  placeholder: string
  min?: PlainDate
  max?: PlainDate
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}

function DatePicker({
  id,
  value,
  onChange,
  formatValue,
  placeholder,
  min,
  max,
  invalid,
  describedBy,
  disabled,
  ...company
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? toDate(value) : undefined
  const { modifiers, modifiersClassNames } = calendarModifiers(company)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FieldButton
          id={id}
          invalid={invalid}
          describedBy={describedBy}
          placeholder={placeholder}
          text={value ? formatValue(value) : undefined}
          disabled={disabled}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? toPlain(date) : null)
            setOpen(false)
          }}
          weekStartsOn={company.weekStartsOn}
          locale={company.locale}
          disabled={[
            ...(min ? [{ before: toDate(min) }] : []),
            ...(max ? [{ after: toDate(max) }] : []),
          ]}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

type DateRangeValue = { from: PlainDate | null; to: PlainDate | null }

type DateRangePickerProps = CompanyCalendar & {
  id?: string
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  /** Formats the range for the field (Intl formatRange). */
  formatValue: (from: PlainDate, to: PlainDate) => string
  placeholder: string
  /** Live summary ("5 working days · excludes Thu 22 Oct"), announced politely. */
  summary?: React.ReactNode
  /** Footer actions, e.g. Clear / Apply. */
  footer?: React.ReactNode
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
}

function DateRangePicker({
  id,
  value,
  onChange,
  formatValue,
  placeholder,
  summary,
  footer,
  invalid,
  describedBy,
  disabled,
  ...company
}: DateRangePickerProps) {
  const selected: DateRange | undefined = value.from
    ? { from: toDate(value.from), to: value.to ? toDate(value.to) : undefined }
    : undefined
  const { modifiers, modifiersClassNames } = calendarModifiers(company)
  const text =
    value.from && value.to ? formatValue(value.from, value.to) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FieldButton
          id={id}
          invalid={invalid}
          describedBy={describedBy}
          placeholder={placeholder}
          text={text}
          disabled={disabled}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          defaultMonth={selected?.from}
          numberOfMonths={2}
          onSelect={(range) =>
            onChange({
              from: range?.from ? toPlain(range.from) : null,
              to: range?.to ? toPlain(range.to) : null,
            })
          }
          weekStartsOn={company.weekStartsOn}
          locale={company.locale}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          autoFocus
        />
        {summary || footer ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-border px-3 py-2">
            <div
              aria-live="polite"
              className="text-body-sm text-muted-foreground"
            >
              {summary}
            </div>
            {footer ? <div className="ms-auto flex gap-2">{footer}</div> : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export {
  DatePicker,
  DateRangePicker,
  toDate as plainDateToDate,
  toPlain as dateToPlainDate,
  type DateRangeValue,
}
