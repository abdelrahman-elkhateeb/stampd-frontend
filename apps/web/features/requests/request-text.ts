"use client"

import { useTranslations } from "next-intl"

import { useFormat } from "@/lib/use-format"

import type {
  LeaveTypeName,
  Request,
  RequestType,
  TypeField,
} from "./request-data"

/** Category chips and icons by type key; unknown keys render neutral. */
const CATEGORIES: Record<string, string> = {
  LEAVE: "leave",
  WFH: "wfh",
  BUSINESS_TRIP: "trip",
  PERMISSION: "permission",
  ATTENDANCE_CORRECTION: "correction",
}

export const categoryOf = (type: string) => CATEGORIES[type] ?? ""

/** A request type's name by key, when the type list isn't at hand (falls back to the key). */
export function useRequestTypeLabel() {
  const t = useTranslations("requests")
  return (key: string) =>
    t.has(`types.${key}.label` as never)
      ? t(`types.${key}.label` as never)
      : key
}

/** Labels and values for requests, translated by key (the API's labels are English only). */
export function useRequestText({
  types,
  leaveTypes,
}: {
  types: RequestType[]
  leaveTypes: LeaveTypeName[]
}) {
  const t = useTranslations("requests")
  const format = useFormat()

  // Keys are dynamic: an unknown one falls back to what the API sent.
  const known = (key: string) => t.has(key as never)
  const tr = (key: string) => t(key as never)

  function typeLabel(key: string) {
    if (known(`types.${key}.label`)) return tr(`types.${key}.label`)
    return types.find((type) => type.key === key)?.label ?? key
  }

  function fieldLabel(name: string) {
    return known(`fields.${name}`) ? tr(`fields.${name}`) : name
  }

  function value(field: TypeField, raw: unknown) {
    if (raw === null || raw === undefined || raw === "") return null
    const text = String(raw)
    if (field.kind === "leaveType")
      return leaveTypes.find((type) => type.id === text)?.name ?? text
    if (field.kind === "choice" && known(`options.${text}`))
      return tr(`options.${text}`)
    return text
  }

  function days(request: Request) {
    return request.startDate === request.endDate
      ? format.day(request.startDate)
      : format.dayRange(request.startDate, request.endDate)
  }

  /** "14:00–17:00", or "" when the type has no times. */
  function times(request: Request) {
    return [request.startTime, request.endTime].filter(Boolean).join("–")
  }

  return {
    typeLabel,
    typeDescription: (key: string) =>
      known(`types.${key}.description`) ? tr(`types.${key}.description`) : "",
    fieldLabel,
    value,
    /** "Leave · Annual leave": the type plus its leave type. */
    title(request: Request) {
      const fields = types.find((type) => type.key === request.type)?.fields
      const picks = (fields ?? [])
        .filter((field) => field.kind === "leaveType")
        .map((field) => value(field, request.data[field.name]))
        .filter(Boolean)
      return [typeLabel(request.type), ...picks].join(" · ")
    },
    days,
    times,
    /** The days, plus the time window when there is one ("Tue 13 Oct · 14:00–17:00"). */
    when(request: Request) {
      return [days(request), times(request)].filter(Boolean).join(" · ")
    },
  }
}
