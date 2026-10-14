import { api } from "@/lib/api"
import { toWeekday } from "@/lib/user"
import type { Weekday } from "@workspace/ui/components/date-picker"

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
