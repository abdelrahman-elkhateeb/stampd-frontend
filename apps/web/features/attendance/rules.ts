import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"
import type {
  AttendanceStatus,
  Flag,
} from "@workspace/ui/components/status-chip"

/** ISO instants; shown in company time. */
export type Session = { in: string; out?: string }

/** The API's day statuses (BE-07). */
export type ApiAttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "WFH"
  | "ON_LEAVE"
  | "BUSINESS_TRIP"
  | "HOLIDAY"
  | "WEEKEND"
  | "MISSING_CHECKOUT"

const STATUSES: Record<ApiAttendanceStatus, AttendanceStatus> = {
  PRESENT: "present",
  LATE: "late",
  ABSENT: "absent",
  WFH: "wfh",
  ON_LEAVE: "leave",
  BUSINESS_TRIP: "trip",
  HOLIDAY: "holiday",
  WEEKEND: "weekend",
  MISSING_CHECKOUT: "missing",
}

export const toAttendanceStatus = (status: ApiAttendanceStatus | null) =>
  status ? STATUSES[status] : null

const FLAGS: Record<string, Flag> = {
  CORRECTED: "corrected",
  WFH_NO_CHECK_IN: "wfh-no-checkin",
  WORKED_ON_NON_WORKING_DAY: "worked-non-working-day",
}

/** Flags the app shows; WORKED_DURING_TIME_OFF has no chip. */
export const toFlags = (flags: string[]) =>
  flags.flatMap((flag) => FLAGS[flag] ?? [])

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

/** An instant as "HH:mm" in company time (for time inputs). */
export function companyTime(instant: string, timeZone: string) {
  const minutes = companyMinutes(instant, timeZone)
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

/** The instant a company wall-clock time happens on a day. */
export function companyInstant(day: PlainDate, time: string, timeZone: string) {
  const guess = Date.parse(`${day}T${time}:00Z`)
  let offset = companyMinutes(guess, timeZone) - clockMinutes(time)
  if (offset > 720) offset -= 1440
  if (offset < -720) offset += 1440
  return new Date(guess - offset * 60_000).toISOString()
}

/** "08:15" → 495. */
export function clockMinutes(time: string) {
  const [h = 0, m = 0] = time.split(":").map(Number)
  return h * 60 + m
}

/** Closed sessions plus the open one up to now; pass null for a past day (it stays open). */
export function workedMinutes(sessions: Session[], now: number | null) {
  const ms = sessions.reduce((sum, session) => {
    const end = session.out ? Date.parse(session.out) : now
    return end === null ? sum : sum + Math.max(0, end - Date.parse(session.in))
  }, 0)
  return Math.floor(ms / 60_000)
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
    attended: count("present", "late", "missing", "wfh"),
    late: count("late"),
    absent: count("absent"),
    worked: days.reduce((sum, day) => sum + day.worked, 0),
  }
}
