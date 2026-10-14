"use client"

import { useLocale, useTranslations } from "next-intl"

import { useFormat } from "@/lib/use-format"

import {
  DEMO_REQUEST_TYPES,
  type DateRange,
  type FieldMeta,
  type FieldValue,
  type MyRequest,
  type RequestTypeMeta,
} from "./demo-data"
import { localize, requestSpan } from "./rules"

export function requestType(key: string): RequestTypeMeta | undefined {
  return DEMO_REQUEST_TYPES.find((type) => type.key === key)
}

/** Labels and values from the type metadata, in the user's language and formats. */
export function useRequestText() {
  const locale = useLocale()
  const format = useFormat()
  const t = useTranslations("requests")

  const text = (value: Parameters<typeof localize>[0]) =>
    localize(value, locale)

  function range({ from, to }: DateRange) {
    return from === to ? format.day(from) : format.dayRange(from, to)
  }

  function value(field: FieldMeta, raw: FieldValue | undefined) {
    if (raw === null || raw === undefined || raw === "") return null
    switch (field.type) {
      case "date":
        return format.day(raw as string)
      case "date-range":
        return range(raw as DateRange)
      case "select": {
        const option = field.options?.find((item) => item.value === raw)
        return option ? text(option.label) : String(raw)
      }
      case "number":
        return format.number(raw as number)
      case "boolean":
        return t(raw ? "yes" : "no")
      default:
        return String(raw)
    }
  }

  return {
    text,
    typeLabel: (key: string) => {
      const meta = requestType(key)
      return meta ? text(meta.label) : key
    },
    value,
    /** "Leave · Annual leave": the type plus its select fields' values. */
    title(request: MyRequest) {
      const meta = requestType(request.type)
      if (!meta) return request.type
      const picks = meta.fields
        .filter((field) => field.type === "select")
        .map((field) => value(field, request.values[field.key]))
        .filter(Boolean)
      return [text(meta.label), ...picks].join(" · ")
    },
    /** The days, plus a time window when the type has one ("Tue 13 Oct · 14:00–17:00"). */
    when(request: MyRequest) {
      const meta = requestType(request.type)
      if (!meta) return ""
      const span = requestSpan(meta, request.values)
      const times = meta.fields
        .filter((field) => field.type === "time")
        .map((field) => request.values[field.key])
        .filter((time): time is string => typeof time === "string" && !!time)
      return [span ? range(span) : null, times.length ? times.join("–") : null]
        .filter(Boolean)
        .join(" · ")
    },
  }
}
