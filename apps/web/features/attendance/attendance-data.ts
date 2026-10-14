import { api } from "@/lib/api"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import type {
  AttendanceStatus,
  Flag,
} from "@workspace/ui/components/status-chip"

import {
  toAttendanceStatus,
  toFlags,
  type ApiAttendanceStatus,
  type Session,
} from "./rules"

/** One day as the views return it (BE-07). */
type ApiDay = {
  recordId: string | null
  date: PlainDate
  status: ApiAttendanceStatus | null
  flags: string[]
  firstCheckInAt: string | null
  lastCheckOutAt: string | null
  workedMinutes: number
}

type ApiSession = { id: string; checkInAt: string; checkOutAt: string | null }

/** A day in app form: the server decides the status. */
export type Day = {
  date: PlainDate
  recordId: string | null
  status: AttendanceStatus | null
  flags: Flag[]
  firstIn: string | null
  lastOut: string | null
  worked: number
}

export type Today = Day & {
  /** false when attendance isn't expected today (not tracked, not started). */
  expected: boolean
  tracksAttendance: boolean
  sessions: Session[]
  /** Server clock when the day was read; the live counter runs from it. */
  serverNow: number
}

export type ApiToday = ApiDay & {
  expected: boolean
  tracksAttendance: boolean
  sessions: ApiSession[]
}

export const toDay = (day: ApiDay): Day => ({
  date: day.date,
  recordId: day.recordId,
  status: toAttendanceStatus(day.status),
  flags: toFlags(day.flags),
  firstIn: day.firstCheckInAt,
  lastOut: day.lastCheckOutAt,
  worked: day.workedMinutes,
})

const toSession = (session: ApiSession): Session => ({
  in: session.checkInAt,
  out: session.checkOutAt ?? undefined,
})

export const toToday = (today: ApiToday): Today => ({
  ...toDay(today),
  expected: today.expected,
  tracksAttendance: today.tracksAttendance,
  sessions: today.sessions.map(toSession),
  serverNow: Date.now(),
})

/** Server only. The caller's day, as of now. */
export async function getToday() {
  return toToday(await api<ApiToday>("/attendance/today"))
}

export type EmployeeDays = {
  employee: { id: string; name: string }
  days: Day[]
}

type ApiGrid = {
  items: { employee: { id: string; name: string }; days: ApiDay[] }[]
  meta: { totalItems: number }
}

const toGrid = ({ items }: ApiGrid): EmployeeDays[] =>
  items.map(({ employee, days }) => ({ employee, days: days.map(toDay) }))

/** A month's days for the people the caller may see (self / team / company). */
export async function getMonth(
  month: string,
  filters: Record<string, string | undefined> = {}
) {
  const params = new URLSearchParams({ month, pageSize: "100" })
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(key, value)
  // ponytail: first 100 people; page the grid when a company outgrows it.
  return toGrid(await api<ApiGrid>(`/attendance/month?${params}`))
}

/** One day for everyone the caller may see. */
export async function getDays(
  date: PlainDate,
  filters: Record<string, string | undefined> = {}
) {
  const params = new URLSearchParams({ date, pageSize: "100" })
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(key, value)
  return toGrid(await api<ApiGrid>(`/attendance/days?${params}`))
}

type ApiHistoryEntry = {
  id: string
  action: string
  at: string
  actor: { type: "USER"; name?: string | null } | { type: "SYSTEM" }
  source: "USER" | "APPROVAL" | "SYSTEM_JOB"
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  reason: string | null
}

export type DayChange = {
  id: string
  action: string
  at: string
  actor: string | null
  source: ApiHistoryEntry["source"]
  before: DaySnapshot
  after: DaySnapshot
  reason: string | null
}

type DaySnapshot = {
  sessions?: Session[]
  status?: AttendanceStatus | null
}

const snapshot = (values: Record<string, unknown> | null): DaySnapshot => ({
  sessions: (values?.sessions as ApiSession[] | undefined)?.map(toSession),
  status:
    values && "status" in values
      ? toAttendanceStatus(values.status as ApiAttendanceStatus | null)
      : undefined,
})

export type DayDetail = {
  employee: { id: string; name: string }
  day: Day
  sessions: (Session & { id: string })[]
  history: DayChange[]
}

/** A day's sessions and its change history (self / team / company). */
export async function getDayDetail(
  employeeId: string,
  date: PlainDate
): Promise<DayDetail> {
  const detail = await api<{
    employee: { id: string; name: string }
    day: ApiDay
    sessions: ApiSession[]
  }>(`/attendance/employees/${employeeId}/days/${date}`)
  const history = detail.day.recordId
    ? await api<{ items: ApiHistoryEntry[] }>(
        `/history/attendance-days/${detail.day.recordId}?pageSize=100`
      ).then(({ items }) => items)
    : []
  return {
    employee: detail.employee,
    day: toDay(detail.day),
    sessions: detail.sessions.map((session) => ({
      id: session.id,
      ...toSession(session),
    })),
    history: history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      at: entry.at,
      actor: entry.actor.type === "USER" ? (entry.actor.name ?? null) : null,
      source: entry.source,
      before: snapshot(entry.oldValues),
      after: snapshot(entry.newValues),
      reason: entry.reason,
    })),
  }
}

export type AttendanceException = {
  employee: { id: string; name: string }
  day: Day
}

/** Admin: Missing Checkout and Absent days in a range (≤ the API's limit), newest first. */
export async function getExceptions(from: PlainDate, to: PlainDate) {
  // ponytail: first 100; page when a company has more in a month.
  const { items } = await api<{
    items: (ApiDay & { employee: { id: string; name: string } })[]
  }>(`/attendance/exceptions?from=${from}&to=${to}&pageSize=100`)
  return items.map(({ employee, ...day }) => ({ employee, day: toDay(day) }))
}
