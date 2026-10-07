import { TZDate } from "@date-fns/tz"
import { differenceInCalendarDays } from "date-fns"

import { getIntlLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"

/**
 * Formatting rules from docs/design-system/formatting.md.
 *
 * Two kinds of time, never mixed:
 * - Timestamps (UTC ISO strings) are shown in the company timezone, never the device's.
 * - Calendar days ("YYYY-MM-DD") are plain dates: kept as strings, formatted in UTC
 *   so they can't shift by a day.
 */
export type FormatContext = { locale: Locale; timeZone: string }

/**
 * ICU versions disagree on spacing: Node may emit thin or narrow no-break spaces where the
 * browser emits plain ones ("18 – 22 Oct"). Server-rendered text must match the client's,
 * so every formatted string goes through this.
 */
function clean(text: string) {
  return text.replace(/[\u2009\u202f\u00a0]/g, " ")
}

export type PlainDate = string

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isPlainDate(value: string): value is PlainDate {
  return (
    PLAIN_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  )
}

function plainDateToUtc(value: PlainDate): Date {
  if (!isPlainDate(value)) {
    throw new RangeError(`Expected a YYYY-MM-DD calendar date, got "${value}"`)
  }
  return new Date(`${value}T00:00:00Z`)
}

const DATE_STYLES = {
  short: { weekday: "short", day: "numeric", month: "short" },
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
  month: { month: "long", year: "numeric" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>

export type DateStyle = keyof typeof DATE_STYLES

/** 24-hour time in company time, e.g. "08:02". */
export function formatTime(iso: string, ctx: FormatContext) {
  return clean(
    new Intl.DateTimeFormat(getIntlLocale(ctx.locale), {
      timeZone: ctx.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso))
  )
}

/** The company-time calendar date of a timestamp, e.g. "Tue 6 Oct". */
export function formatDateTime(
  iso: string,
  ctx: FormatContext,
  style: DateStyle = "short"
) {
  return clean(
    new Intl.DateTimeFormat(getIntlLocale(ctx.locale), {
      timeZone: ctx.timeZone,
      ...DATE_STYLES[style],
    }).format(new Date(iso))
  )
}

/** A plain calendar day, e.g. leave dates and holidays. */
export function formatDay(
  day: PlainDate,
  locale: Locale,
  style: DateStyle = "short"
) {
  return clean(
    new Intl.DateTimeFormat(getIntlLocale(locale), {
      timeZone: "UTC",
      ...DATE_STYLES[style],
    }).format(plainDateToUtc(day))
  )
}

/** A range of plain days, always via formatRange ("11 – 15 Oct"). */
export function formatDayRange(
  start: PlainDate,
  end: PlainDate,
  locale: Locale
) {
  return clean(
    new Intl.DateTimeFormat(getIntlLocale(locale), {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
    }).formatRange(plainDateToUtc(start), plainDateToUtc(end))
  )
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
) {
  return clean(
    new Intl.NumberFormat(getIntlLocale(locale), options).format(value)
  )
}

export function formatPercent(ratio: number, locale: Locale) {
  return formatNumber(ratio, locale, {
    style: "percent",
    maximumFractionDigits: 1,
  })
}

/** "7h 45m" / "7س 45د". Zero parts are dropped ("45m", "8h"); no seconds. */
export function formatDuration(totalMinutes: number, locale: Locale) {
  const minutes = Math.max(Math.round(totalMinutes), 0)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  const [hourUnit, minuteUnit] = locale === "ar" ? ["س", "د"] : ["h", "m"]
  const parts = []
  if (hours) parts.push(`${formatNumber(hours, locale)}${hourUnit}`)
  if (rest || !hours) parts.push(`${formatNumber(rest, locale)}${minuteUnit}`)
  return parts.join(" ")
}

/**
 * "just now" → minutes → hours → "yesterday" → short date, judged in company time.
 * Depends on the current time, so render it on the client only (see <RelativeTime>).
 */
export function formatRelative(
  iso: string,
  ctx: FormatContext,
  now: Date = new Date()
) {
  const then = new Date(iso)
  const seconds = Math.round((then.getTime() - now.getTime()) / 1000)
  const relative = (style: "short" | "long") =>
    new Intl.RelativeTimeFormat(getIntlLocale(ctx.locale), {
      numeric: "auto",
      style,
    })

  // Intl says "now"; the design system says "just now" / «الآن».
  if (Math.abs(seconds) < 60) return ctx.locale === "ar" ? "الآن" : "just now"
  if (Math.abs(seconds) < 3600)
    return clean(relative("short").format(Math.round(seconds / 60), "minute"))

  const days = differenceInCalendarDays(
    new TZDate(then, ctx.timeZone),
    new TZDate(now, ctx.timeZone)
  )
  if (days === 0)
    return clean(relative("short").format(Math.round(seconds / 3600), "hour"))
  if (days === -1) return clean(relative("long").format(-1, "day"))
  return formatDateTime(iso, ctx, "short")
}

/** Today's calendar date in the company's timezone (not the device's). */
export function todayInZone(
  timeZone: string,
  now: Date = new Date()
): PlainDate {
  const zoned = new TZDate(now, timeZone)
  const month = String(zoned.getMonth() + 1).padStart(2, "0")
  const day = String(zoned.getDate()).padStart(2, "0")
  return `${zoned.getFullYear()}-${month}-${day}`
}

/** Inputs accept both digit systems; stored values are always ASCII. */
export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
}
