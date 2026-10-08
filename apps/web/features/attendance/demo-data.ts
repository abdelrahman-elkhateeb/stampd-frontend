import { DEMO_COMPANY, DEMO_HOLIDAYS } from "@/features/settings/demo-data"
import { DEMO_USER } from "@/lib/demo-user"
import type { PlainDate } from "@workspace/ui/components/date-picker"

import {
  addDays,
  companyDate,
  companyInstant,
  isWorkingDay,
  type AttendanceRules,
} from "./rules"

/** ISO instants; shown in company time. */
export type Session = { in: string; out?: string }

export type DayCorrection = {
  id: string
  actor: string
  at: string
  source: "manual" | "request"
  requestId?: string
  fields: { field: "checkIn" | "checkOut"; from?: string; to: string }[]
  reason: string
}

export type DayRecord = {
  date: PlainDate
  sessions: Session[]
  leave?: boolean
  corrections?: DayCorrection[]
}

// ponytail: the API sends serverTimeOffsetMs with GET /attendance/today (BE-07); the demo
// trusts the device clock.
export const SERVER_TIME_OFFSET_MS = 0

const HISTORY_DAYS = 75

/** The current day in company time. */
export function companyToday(now: number) {
  return companyDate(new Date(now), DEMO_USER.company.timezone)
}

export function demoRules(today: PlainDate): AttendanceRules {
  return {
    today,
    since: addDays(today, -HISTORY_DAYS),
    timeZone: DEMO_USER.company.timezone,
    workingDays: DEMO_COMPANY.workingDays,
    holidays: new Map(
      DEMO_HOLIDAYS.map((holiday) => [holiday.date, holiday.name])
    ),
    workStart: DEMO_COMPANY.workStart,
    workEnd: DEMO_COMPANY.workEnd,
    graceMinutes: DEMO_COMPANY.graceMinutes,
  }
}

/**
 * ponytail: generated relative to today so the demo never goes stale; GET /attendance?month=
 * returns these days (BE-07). Deterministic: the same day always gets the same pattern.
 */
export function demoHistory(rules: AttendanceRules): DayRecord[] {
  const time = (day: PlainDate, hhmm: string) =>
    companyInstant(day, hhmm, rules.timeZone)
  const records: DayRecord[] = []
  for (let offset = HISTORY_DAYS; offset >= 1; offset--) {
    const date = addDays(rules.today, -offset)
    if (!isWorkingDay(date, rules)) continue
    const seed = Date.parse(date) / 86_400_000
    const minute = seed % 9
    if (offset === 18 || offset === 19) {
      records.push({ date, sessions: [], leave: true })
    } else if (seed % 13 === 5) {
      continue // absent
    } else if (offset === 9) {
      // Forgot to check out; HR fixed it the next morning.
      records.push({
        date,
        sessions: [
          { in: time(date, `07:5${minute}`), out: time(date, "17:02") },
        ],
        corrections: [
          {
            id: `c-${date}`,
            actor: "HR",
            at: time(addDays(date, 1), "09:14"),
            source: "manual",
            fields: [{ field: "checkOut", to: time(date, "17:02") }],
            reason: "Badge log shows the exit at 17:02.",
          },
        ],
      })
    } else {
      const late = seed % 7 === 3
      records.push({
        date,
        sessions: [
          {
            in: time(date, late ? `08:2${minute}` : `07:5${minute}`),
            out: time(date, "12:30"),
          },
          { in: time(date, "13:15"), out: time(date, `17:0${minute}`) },
        ],
      })
    }
  }
  // The last day worked was never closed: shows the "missing checkout" warning.
  const last = records.at(-1)
  if (last?.sessions[0]) last.sessions = [{ in: last.sessions[0].in }]
  return records
}
