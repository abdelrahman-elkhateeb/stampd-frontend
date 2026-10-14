import { z } from "zod"

import type { DateRangeValue } from "@workspace/ui/components/date-picker"

import type { RequestType, TypeField } from "./request-data"

/** The kinds the generic form renders; `leaveType` belongs to the leave flow (FE-07). */
const SUPPORTED_KINDS = ["text", "time", "choice"]

/** Fail closed (request-form-renderer.md › 4): any unknown kind blocks the form. */
export function unsupportedFields(type: RequestType) {
  return type.fields.filter((field) => !SUPPORTED_KINDS.includes(field.kind))
}

/** Longer text fields get a textarea. */
export const isLongText = (field: TypeField) => (field.maxLength ?? 0) > 100

/**
 * Form values: the dates (`startDate`, or `dates` for a range), the times, the reason,
 * and each type field under its own name. ponytail: assumes no type field is named like
 * those; prefix them if one ever is.
 */
export type RequestFormValues = Record<string, string | DateRangeValue | null>

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const REASON_MAX = 1000

const text = (max: number, required: boolean) => {
  const value = z.string().trim().max(max)
  return required ? value.min(1) : value
}
const time = (required: boolean) =>
  required ? z.string().regex(TIME) : z.string().regex(TIME).or(z.literal(""))

function fieldSchema(field: TypeField) {
  switch (field.kind) {
    case "time":
      return time(field.required)
    case "choice": {
      const choice = z.enum((field.options ?? []) as [string, ...string[]])
      return field.required ? choice : choice.or(z.literal(""))
    }
    default:
      return text(field.maxLength ?? REASON_MAX, field.required)
  }
}

// The picker gives { from, to } with nulls while picking; one issue on the field itself.
const range = z.unknown().superRefine((value, ctx) => {
  const dates = value as DateRangeValue | null
  if (!dates?.from || !dates.to)
    ctx.addIssue({ code: "custom", message: "REQUIRED" })
  else if (dates.to < dates.from)
    ctx.addIssue({ code: "custom", message: "END_BEFORE_START" })
})

/** The client-side checks; the server repeats them and adds its own (overlaps, limits). */
export function buildSchema(type: RequestType) {
  const timesRequired = type.times === "REQUIRED"
  return z
    .object({
      ...(type.dates === "RANGE"
        ? { dates: range }
        : { startDate: z.string().min(1) }),
      ...(type.times !== "NONE" && {
        startTime: time(timesRequired),
        endTime: time(timesRequired),
      }),
      reason: text(REASON_MAX, type.reason === "REQUIRED"),
      ...Object.fromEntries(
        type.fields.map((field) => [field.name, fieldSchema(field)])
      ),
    })
    .superRefine((values, ctx) => {
      const { startTime, endTime } = values as Record<string, string>
      if (startTime && endTime && endTime <= startTime)
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "END_BEFORE_START",
        })
    })
}

/** Empty values for the type, with `date` (e.g. ?date= from FE-06) on its dates. */
export function initialValues(
  type: RequestType,
  date?: string | null
): RequestFormValues {
  return {
    ...(type.dates === "RANGE"
      ? { dates: date ? { from: date, to: date } : null }
      : { startDate: date ?? "" }),
    ...(type.times !== "NONE" && { startTime: "", endTime: "" }),
    reason: "",
    ...Object.fromEntries(type.fields.map((field) => [field.name, ""])),
  }
}

/** API field → form field, for showProblem. */
export function formFieldNames(type: RequestType) {
  return {
    ...(type.dates === "RANGE" && { startDate: "dates", endDate: "dates" }),
    ...(type.dates === "SINGLE_DAY" && { endDate: "startDate" }),
    ...Object.fromEntries(
      type.fields.map((field) => [`data.${field.name}`, field.name])
    ),
  }
}

/** The form field that shows a date problem (REQUEST_OVERLAP has no field). */
export const datesField = (type: RequestType) =>
  type.dates === "RANGE" ? "dates" : "startDate"

const orNull = (value: unknown) =>
  typeof value === "string" ? value.trim() || null : null

/** The POST /requests body for these (valid) values. */
export function toRequestBody(type: RequestType, values: RequestFormValues) {
  const dates = values.dates as DateRangeValue | null
  const startDate = (dates?.from ?? values.startDate) as string
  return {
    type: type.key,
    startDate,
    endDate: (dates?.to ?? startDate) as string,
    ...(type.times !== "NONE" && {
      startTime: orNull(values.startTime),
      endTime: orNull(values.endTime),
    }),
    reason: orNull(values.reason),
    data: Object.fromEntries(
      type.fields.map((field) => [field.name, orNull(values[field.name])])
    ),
  }
}

export type RequestBody = ReturnType<typeof toRequestBody>
