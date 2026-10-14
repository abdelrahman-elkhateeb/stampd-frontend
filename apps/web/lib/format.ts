import { getIntlLocale } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import type { PlainDate } from "@workspace/ui/components/date-picker"

/**
 * Formatting rules from docs/design-system/formatting.md.
 * Calendar days ("YYYY-MM-DD") are plain dates: kept as strings, formatted in UTC
 * so they can't shift by a day.
 */

/**
 * ICU versions disagree on spacing: Node may emit thin or narrow no-break spaces where the
 * browser emits plain ones ("18 – 22 Oct"). Server-rendered text must match the client's,
 * so every formatted string goes through this.
 */
function clean(text: string) {
  return text.replace(/[\u2009\u202f\u00a0]/g, " ")
}

/** A search param's first value (Next gives a string, an array or nothing). */
export const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

/** "YYYY-MM". */
export const isMonth = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)

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

/** An instant as 24-hour company time ("08:02"). */
export function formatTime(iso: string, locale: Locale, timeZone: string) {
  return clean(
    new Intl.DateTimeFormat(getIntlLocale(locale), {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso))
  )
}

/** "7h 45m" / "7س 45د": a zero part is omitted, no seconds. */
export function formatDuration(totalMinutes: number, locale: Locale) {
  const minutes = Math.max(0, Math.floor(totalMinutes))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const [uh, um] = locale === "ar" ? ["س", "د"] : ["h", "m"]
  return [
    h ? formatNumber(h, locale) + uh : "",
    m || !h ? formatNumber(m, locale) + um : "",
  ]
    .filter(Boolean)
    .join(" ")
}
