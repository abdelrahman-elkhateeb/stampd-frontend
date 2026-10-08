import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"
import type { AttendanceStatus } from "@workspace/ui/components/status-chip"

import type { DayRecord, Session } from "./demo-data"

export type AttendanceRules = {
  today: PlainDate
  /** First tracked day: earlier days have no status. */
  since: PlainDate
  timeZone: string
  workingDays: Weekday[]
  holidays: Map<PlainDate, string>
  /** "08:00", company time. */
  workStart: string
  workEnd: string
  graceMinutes: number
}

const DAY_MS = 86_400_000

export function addDays(day: PlainDate, days: number): PlainDate {
  return new Date(Date.parse(day) + days * DAY_MS)
    .toISOString()
    .slice(0, 10) as PlainDate
}

/** 0 = Sunday. */
export function weekday(day: PlainDate) {
  return new Date(Date.parse(day)).getUTCDay() as Weekday
}

/** The calendar day an instant falls on in company time. */
export function companyDate(instant: Date, timeZone: string): PlainDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant) as PlainDate
}

/** Minutes since company midnight. */
export function companyMinutes(instant: string | number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant))
  const part = (type: string) =>
    Number(parts.find((item) => item.type === type)?.value)
  return part("hour") * 60 + part("minute")
}

/** "08:15" → 495. */
export function clockMinutes(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number)
  return h * 60 + m
}

/** The instant a company wall-clock time happens on a day. */
export function companyInstant(day: PlainDate, time: string, timeZone: string) {
  const guess = Date.parse(`${day}T${time}:00Z`)
  let offset = companyMinutes(guess, timeZone) - clockMinutes(time)
  if (offset > 720) offset -= 1440
  if (offset < -720) offset += 1440
  return new Date(guess - offset * 60_000).toISOString()
}

/** Closed sessions plus the open one up to now; pass null for a past day (it stays open). */
export function workedMinutes(sessions: Session[], now: number | null) {
  const ms = sessions.reduce((sum, session) => {
    const end = session.out ? Date.parse(session.out) : now
    return end === null ? sum : sum + Math.max(0, end - Date.parse(session.in))
  }, 0)
  return Math.floor(ms / 60_000)
}

export const openSession = (record?: DayRecord) =>
  record?.sessions.find((session) => !session.out)

export function isWorkingDay(day: PlainDate, rules: AttendanceRules) {
  return rules.workingDays.includes(weekday(day)) && !rules.holidays.has(day)
}

/**
 * What the day looks like. The server decides this (BE-07); the demo mirrors its rules:
 * worked → present / late / missing checkout, otherwise leave, holiday, weekend, absent.
 */
export function dayStatus(
  day: PlainDate,
  record: DayRecord | undefined,
  rules: AttendanceRules
): AttendanceStatus | null {
  if (day < rules.since || day > rules.today) return null
  const sessions = record?.sessions ?? []
  const first = sessions.map((session) => session.in).sort()[0]
  if (first) {
    if (day < rules.today && openSession(record)) return "missing"
    const lateAfter = clockMinutes(rules.workStart) + rules.graceMinutes
    return isWorkingDay(day, rules) &&
      !record?.leave &&
      companyMinutes(first, rules.timeZone) > lateAfter
      ? "late"
      : "present"
  }
  if (record?.leave) return "leave"
  if (rules.holidays.has(day)) return "holiday"
  if (!rules.workingDays.includes(weekday(day))) return "weekend"
  return day < rules.today ? "absent" : "not-yet"
}

/** Why today is unusual, for the Today card note. */
export function todayWarning(
  record: DayRecord | undefined,
  rules: AttendanceRules
): "on-leave" | "holiday" | "non-working" | null {
  if (record?.leave) return "on-leave"
  if (rules.holidays.has(rules.today)) return "holiday"
  if (!rules.workingDays.includes(weekday(rules.today))) return "non-working"
  return null
}

/** The last day worked before today, if it was left without a check-out. */
export function missedCheckout(records: DayRecord[], rules: AttendanceRules) {
  const last = records
    .filter((record) => record.date < rules.today && record.sessions.length)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  return last && openSession(last) ? last.date : null
}

/** Starts a session now. Never two open sessions (FE-06). */
export function checkIn(
  records: DayRecord[],
  today: PlainDate,
  at: string
): DayRecord[] {
  const record = records.find((item) => item.date === today)
  if (openSession(record)) throw new Error("ALREADY_CHECKED_IN")
  const session = { in: at }
  return record
    ? records.map((item) =>
        item === record
          ? { ...item, sessions: [...item.sessions, session] }
          : item
      )
    : [...records, { date: today, sessions: [session] }]
}

export function checkOut(
  records: DayRecord[],
  today: PlainDate,
  at: string
): DayRecord[] {
  const record = records.find((item) => item.date === today)
  const open = openSession(record)
  if (!record || !open) throw new Error("NOT_CHECKED_IN")
  return records.map((item) =>
    item === record
      ? {
          ...item,
          sessions: item.sessions.map((session) =>
            session === open ? { ...session, out: at } : session
          ),
        }
      : item
  )
}

/** "YYYY-MM" ± n months. */
export function addMonths(month: string, months: number) {
  const [year = 0, index = 1] = month.split("-").map(Number)
  return new Date(Date.UTC(year, index - 1 + months, 1))
    .toISOString()
    .slice(0, 7)
}

/** The month's days in week rows, padded with null to whole weeks. */
export function monthGrid(month: string, weekStartsOn: Weekday) {
  const first = `${month}-01` as PlainDate
  const days: (PlainDate | null)[] = Array.from(
    { length: (weekday(first) - weekStartsOn + 7) % 7 },
    () => null
  )
  for (let day = first; day.startsWith(month); day = addDays(day, 1)) {
    days.push(day)
  }
  while (days.length % 7) days.push(null)
  return days
}

/** Counts for the month summary strip. */
export function monthSummary(
  days: { status: AttendanceStatus | null; worked: number }[]
) {
  const count = (...statuses: AttendanceStatus[]) =>
    days.filter((day) => day.status && statuses.includes(day.status)).length
  return {
    attended: count("present", "late", "missing"),
    late: count("late"),
    absent: count("absent"),
    worked: days.reduce((sum, day) => sum + day.worked, 0),
  }
}
