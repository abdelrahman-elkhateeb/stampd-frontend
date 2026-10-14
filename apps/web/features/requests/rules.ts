import { z } from "zod"

import type { Role } from "@/lib/user"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import type { RequestStatus } from "@workspace/ui/components/status-chip"

import type {
  DateRange,
  FieldMeta,
  FieldValue,
  Localized,
  MyRequest,
  RequestTypeMeta,
} from "./demo-data"

export const SUPPORTED_FIELD_TYPES = [
  "date",
  "date-range",
  "time",
  "text",
  "textarea",
  "select",
  "number",
  "boolean",
] as const

/** Fail closed (request-form-renderer.md › 4): any unknown field type blocks the form. */
export function unsupportedFields(meta: RequestTypeMeta) {
  return meta.fields.filter(
    (field) =>
      !(SUPPORTED_FIELD_TYPES as readonly string[]).includes(field.type)
  )
}

const warned = new Set<string>()

/** The label in the user's language, falling back to English (and saying so, once). */
export function localize(text: Localized, locale: string) {
  const value = text[locale as keyof Localized]
  if (value) return value
  if (locale !== "en" && !warned.has(text.en)) {
    warned.add(text.en)
    console.warn(`Missing "${locale}" translation for "${text.en}"`)
  }
  return text.en
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** Zod issue messages are FieldErrorCodes, translated under the field (lib/forms.ts). */
function fieldSchema(field: FieldMeta, today: PlainDate, admin: boolean) {
  const required = field.required === true
  const dateLimits = (date: z.ZodString) =>
    admin
      ? date
      : date
          .refine((day) => field.notBefore !== "today" || day >= today, {
            message: "BEFORE_TODAY",
          })
          .refine((day) => field.notAfter !== "today" || day <= today, {
            message: "AFTER_TODAY",
          })

  switch (field.type) {
    case "date": {
      const date = dateLimits(z.string().min(1))
      return required ? date : date.or(z.literal("")).nullable()
    }
    case "date-range":
      // The picker gives { from, to } with nulls while picking; one issue on the field itself.
      return z.unknown().superRefine((value, ctx) => {
        const range = value as Partial<DateRange> | null
        if (!range?.from || !range.to) {
          if (required || range?.from)
            ctx.addIssue({ code: "custom", message: "REQUIRED" })
          return
        }
        if (range.to < range.from)
          ctx.addIssue({ code: "custom", message: "END_BEFORE_START" })
        else if (!admin && field.notBefore === "today" && range.from < today)
          ctx.addIssue({ code: "custom", message: "BEFORE_TODAY" })
      })
    case "time": {
      const time = z.string().regex(TIME)
      return required ? time : time.or(z.literal("")).nullable()
    }
    case "text":
    case "textarea": {
      let text = z.string().trim()
      if (required) text = text.min(1)
      if (field.maxLength) text = text.max(field.maxLength)
      return required ? text : text.nullable()
    }
    case "select": {
      const values = (field.options ?? []).map((option) => option.value)
      const select = z.string().refine((value) => values.includes(value))
      return required ? select : select.or(z.literal("")).nullable()
    }
    case "number": {
      let number = z.number({
        error: (issue) => (issue.input == null ? "REQUIRED" : "INVALID_FORMAT"),
      })
      if (field.min !== undefined) number = number.min(field.min)
      if (field.max !== undefined) number = number.max(field.max)
      return required ? number : number.nullable()
    }
    case "boolean":
      return required ? z.literal(true, { error: "MUST_ACCEPT" }) : z.boolean()
    default:
      return z.never()
  }
}

/** The form schema built from the type metadata (request-form-renderer.md › 1). */
export function buildSchema(
  meta: RequestTypeMeta,
  { today, admin }: { today: PlainDate; admin: boolean }
) {
  const shape = Object.fromEntries(
    meta.fields.map((field) => [field.key, fieldSchema(field, today, admin)])
  )
  return z.object(shape).superRefine((values, ctx) => {
    for (const field of meta.fields) {
      const start = field.after ? values[field.after] : undefined
      const end = values[field.key]
      if (
        typeof start === "string" &&
        typeof end === "string" &&
        TIME.test(start) &&
        TIME.test(end) &&
        end <= start
      ) {
        ctx.addIssue({
          code: "custom",
          path: [field.key],
          message: "END_BEFORE_START",
        })
      }
    }
  })
}

export type RequestFormValues = Record<string, FieldValue>

/** Empty values per field type, with `prefill` for known keys (e.g. ?date= from FE-06). */
export function initialValues(
  meta: RequestTypeMeta,
  prefill: Record<string, string> = {}
): RequestFormValues {
  return Object.fromEntries(
    meta.fields.map((field) => {
      const given = prefill[field.key]
      if (field.type === "date-range") return [field.key, null]
      if (field.type === "number") return [field.key, null]
      if (field.type === "boolean") return [field.key, false]
      return [field.key, given ?? ""]
    })
  )
}

function isRange(value: FieldValue | undefined): value is DateRange {
  return typeof value === "object" && value !== null && "from" in value
}

/** The days a request covers: its date range, or its single day. */
export function requestSpan(
  meta: RequestTypeMeta,
  values: Record<string, FieldValue>
): DateRange | null {
  for (const field of meta.fields) {
    const value = values[field.key]
    if (field.type === "date-range" && isRange(value)) return value
    if (field.type === "date" && typeof value === "string" && value)
      return { from: value, to: value }
  }
  return null
}

/** Statuses that still hold the days (and so block another request on them). */
const HOLDS_DAYS: RequestStatus[] = ["approved", "cancel-requested"]

/**
 * A non-leave request on a day of approved leave is refused (FE-08 AC). Returns the field
 * to flag and the first clashing day, or null. ponytail: the server repeats this check (BE-09).
 */
export function findLeaveConflict(
  meta: RequestTypeMeta,
  values: Record<string, FieldValue>,
  {
    employeeId,
    requests,
    types,
  }: {
    employeeId: string
    requests: MyRequest[]
    types: RequestTypeMeta[]
  }
): { field: string; day: PlainDate } | null {
  if (meta.category === "leave") return null
  const span = requestSpan(meta, values)
  if (!span) return null
  const field = meta.fields.find(
    (item) => item.type === "date-range" || item.type === "date"
  )!
  for (const request of requests) {
    if (request.employeeId !== employeeId) continue
    if (!HOLDS_DAYS.includes(request.status)) continue
    const type = types.find((item) => item.key === request.type)
    if (type?.category !== "leave") continue
    const leave = requestSpan(type, request.values)
    if (!leave || leave.to < span.from || leave.from > span.to) continue
    return {
      field: field.key,
      day: leave.from > span.from ? leave.from : span.from,
    }
  }
  return null
}

export type RequestAction = "withdraw" | "requestCancellation" | "adminCancel"

/**
 * What the viewer may do (lifecycle: Pending → Approved / Rejected / Withdrawn;
 * Approved → Cancellation requested → Cancelled). ponytail: the API returns allowed actions.
 */
export function allowedActions(
  request: MyRequest,
  meta: RequestTypeMeta | undefined,
  viewer: { id: string; role: Role },
  today: PlainDate
): RequestAction[] {
  const own = request.employeeId === viewer.id
  const start = meta ? requestSpan(meta, request.values)?.from : undefined
  const actions: RequestAction[] = []
  if (own && request.status === "pending") actions.push("withdraw")
  if (
    own &&
    request.status === "approved" &&
    start !== undefined &&
    start > today
  ) {
    actions.push("requestCancellation")
  }
  if (
    viewer.role === "admin" &&
    (request.status === "approved" || request.status === "cancel-requested")
  ) {
    actions.push("adminCancel")
  }
  return actions
}

/** Employees and managers open only their own requests; admins open any (BE-03). */
export function canView(
  request: MyRequest,
  viewer: { id: string; role: Role }
) {
  return viewer.role === "admin" || request.employeeId === viewer.id
}

export type RequestFilters = {
  types: string[]
  statuses: RequestStatus[]
  from: PlainDate | null
  to: PlainDate | null
}

/** The viewer's requests, filtered, newest first. A date filter keeps requests that overlap it. */
export function queryRequests(
  requests: MyRequest[],
  types: RequestTypeMeta[],
  employeeId: string,
  filters: RequestFilters
) {
  return requests
    .filter((request) => request.employeeId === employeeId)
    .filter(
      (request) =>
        filters.types.length === 0 || filters.types.includes(request.type)
    )
    .filter(
      (request) =>
        filters.statuses.length === 0 ||
        filters.statuses.includes(request.status)
    )
    .filter((request) => {
      if (!filters.from && !filters.to) return true
      const meta = types.find((type) => type.key === request.type)
      const span = meta ? requestSpan(meta, request.values) : null
      if (!span) return false
      return (
        (!filters.to || span.from <= filters.to) &&
        (!filters.from || span.to >= filters.from)
      )
    })
    .sort((a, b) => submittedAt(b).localeCompare(submittedAt(a)))
}

export function submittedAt(request: MyRequest) {
  return request.events[0]?.at ?? ""
}
