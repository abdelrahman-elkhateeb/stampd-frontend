"use client"

import { useLocale } from "next-intl"
import { useMemo } from "react"

import type { PlainDate } from "@workspace/ui/components/date-picker"

import { DEMO_USER } from "./demo-user"
import * as format from "./format"

/** The formatters bound to the current locale. */
export function useFormat() {
  const locale = useLocale()

  return useMemo(
    () => ({
      day: (day: PlainDate, style?: format.DateStyle) =>
        format.formatDay(day, locale, style),
      dayRange: (start: PlainDate, end: PlainDate) =>
        format.formatDayRange(start, end, locale),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        format.formatNumber(value, locale, options),
      /** An instant in company time. */
      time: (iso: string) =>
        format.formatTime(iso, locale, DEMO_USER.company.timezone),
      duration: (minutes: number) => format.formatDuration(minutes, locale),
    }),
    [locale]
  )
}
