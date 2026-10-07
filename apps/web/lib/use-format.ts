"use client"

import { useLocale } from "next-intl"
import { useMemo } from "react"

import { useCurrentUser } from "@/components/current-user-provider"

import * as format from "./format"

/** The formatters bound to the current locale and the company's timezone. */
export function useFormat() {
  const locale = useLocale()
  const timeZone = useCurrentUser().company.timezone

  return useMemo(() => {
    const ctx = { locale, timeZone }
    return {
      timeZone,
      time: (iso: string) => format.formatTime(iso, ctx),
      dateTime: (iso: string, style?: format.DateStyle) =>
        format.formatDateTime(iso, ctx, style),
      day: (day: format.PlainDate, style?: format.DateStyle) =>
        format.formatDay(day, locale, style),
      dayRange: (start: format.PlainDate, end: format.PlainDate) =>
        format.formatDayRange(start, end, locale),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        format.formatNumber(value, locale, options),
      percent: (ratio: number) => format.formatPercent(ratio, locale),
      duration: (minutes: number) => format.formatDuration(minutes, locale),
      relative: (iso: string, now?: Date) =>
        format.formatRelative(iso, ctx, now),
      today: () => format.todayInZone(timeZone),
    }
  }, [locale, timeZone])
}
