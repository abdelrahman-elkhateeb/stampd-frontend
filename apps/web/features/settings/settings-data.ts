import { api } from "@/lib/api"
import { toWeekday } from "@/lib/user"
import type { LeaveIconKey } from "@workspace/ui/components/icon-picker"
import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"

/** GET /company/settings as the API sends it (BE-05). */
export type ApiCompanySettings = {
  name: string
  timezone: string
  timezoneEffectiveFrom: string | null
  weekStart: string
  workingDays: string[]
  workStartTime: string
  workEndTime: string
  lateGraceMinutes: number
  leaveYearStartMonth: number
  disabledRequestTypes: string[]
  logoUrl: string | null
}

export type CompanySettings = {
  name: string
  timezone: string
  /** Set while a timezone change waits for the company's next day. */
  timezoneEffectiveFrom: string | null
  weekStart: Weekday
  workingDays: Weekday[]
  workStart: string
  workEnd: string
  graceMinutes: number
  /** 1 = January. */
  leaveYearStartMonth: number
  disabledRequestTypes: string[]
  logoUrl: string | null
}

export const toCompanySettings = (
  settings: ApiCompanySettings
): CompanySettings => ({
  name: settings.name,
  timezone: settings.timezone,
  timezoneEffectiveFrom: settings.timezoneEffectiveFrom,
  weekStart: toWeekday(settings.weekStart),
  workingDays: settings.workingDays.map(toWeekday),
  workStart: settings.workStartTime,
  workEnd: settings.workEndTime,
  graceMinutes: settings.lateGraceMinutes,
  leaveYearStartMonth: settings.leaveYearStartMonth,
  disabledRequestTypes: settings.disabledRequestTypes,
  logoUrl: settings.logoUrl,
})

/** Server only; every role may read it. */
export async function getCompanySettings() {
  return toCompanySettings(await api<ApiCompanySettings>("/company/settings"))
}

type ApiHistoryEntry = {
  id: string
  action: string
  at: string
  actor: { type: "USER"; name: string | null } | { type: "SYSTEM" }
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
}

export type SettingsChange = {
  id: string
  actor: string | null
  at: string
  /** API field names (workStartTime, …) with their old and new values. */
  fields: { field: string; from: unknown; to: unknown }[]
}

/** Admin only: changes to the company settings, newest first. */
export async function getSettingsHistory(
  companyId: string
): Promise<SettingsChange[]> {
  // ponytail: the latest 100 changes; page it when someone needs older ones.
  const { items } = await api<{ items: ApiHistoryEntry[] }>(
    `/history/company-settings/${companyId}?pageSize=100`
  )
  return items
    .filter((entry) => entry.action === "companySettings.changed")
    .map((entry) => ({
      id: entry.id,
      actor: entry.actor.type === "USER" ? entry.actor.name : null,
      at: entry.at,
      fields: Object.keys(entry.newValues ?? {}).map((field) => ({
        field,
        from: entry.oldValues?.[field],
        to: entry.newValues?.[field],
      })),
    }))
}

export type HolidayItem = {
  id: string
  name: string
  startDate: PlainDate
  endDate: PlainDate
}

/** Every role may read them; a holiday overlapping the year is listed. */
export async function getHolidays(year: number) {
  const { items } = await api<{ items: HolidayItem[] }>(
    `/company/holidays?year=${year}`
  )
  return items
}

/** GET /leave/types as the API sends it (BE-08). */
type ApiLeaveType = {
  id: string
  name: string
  icon: string
  paid: boolean
  tracksBalance: boolean
  defaultAllowanceDays: number
  allowNegativeBalance: boolean
  halfDaysAllowed: boolean
  requiresReason: boolean
  archived: boolean
  inUse: boolean
}

export type LeaveType = {
  id: string
  name: string
  icon: LeaveIconKey
  paid: boolean
  tracked: boolean
  /** Days per leave year; only for tracked types. */
  allowance: number
  allowNegative: boolean
  halfDays: boolean
  reasonRequired: boolean
  /** Used by at least one request, so it can only be archived. */
  inUse: boolean
  archived: boolean
}

const toLeaveType = (type: ApiLeaveType): LeaveType => ({
  id: type.id,
  name: type.name,
  // The UI's icon set is keyed by the API's icon names.
  icon: type.icon as LeaveIconKey,
  paid: type.paid,
  tracked: type.tracksBalance,
  allowance: type.defaultAllowanceDays,
  allowNegative: type.allowNegativeBalance,
  halfDays: type.halfDaysAllowed,
  reasonRequired: type.requiresReason,
  inUse: type.inUse,
  archived: type.archived,
})

/** Admins also get archived types. */
export async function getLeaveTypes() {
  const { items } = await api<{ items: ApiLeaveType[] }>(
    "/leave/types?includeArchived=true"
  )
  return items.map(toLeaveType)
}
