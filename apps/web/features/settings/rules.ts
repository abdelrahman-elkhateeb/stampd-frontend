import { WEEKDAYS } from "@/lib/user"
import type { Weekday } from "@workspace/ui/components/date-picker"

import type { CompanySettings } from "./settings-data"

/** "Sun–Thu" for a run of days in week order, otherwise "Sun, Tue, Thu". */
export function workingDaysSummary(
  days: Weekday[],
  weekStartsOn: Weekday,
  shortNames: string[]
) {
  const order = Array.from(
    { length: 7 },
    (_, index) => ((weekStartsOn + index) % 7) as Weekday
  ).filter((day) => days.includes(day))
  const positions = order.map((day) => (day - weekStartsOn + 7) % 7)
  const contiguous = positions.every(
    (position, index) => index === 0 || position === positions[index - 1]! + 1
  )
  const name = (day: Weekday) => shortNames[day]!
  return contiguous && order.length > 2
    ? `${name(order[0]!)}–${name(order.at(-1)!)}`
    : order.map(name).join(", ")
}

/** What the company form edits, in app form. */
export type CompanyValues = Pick<
  CompanySettings,
  | "name"
  | "timezone"
  | "workingDays"
  | "workStart"
  | "workEnd"
  | "graceMinutes"
  | "leaveYearStartMonth"
>

/** API names for the form's fields; also maps field errors back. */
export const SETTINGS_FIELDS = {
  name: "name",
  timezone: "timezone",
  workingDays: "workingDays",
  workStart: "workStartTime",
  workEnd: "workEndTime",
  graceMinutes: "lateGraceMinutes",
  leaveYearStartMonth: "leaveYearStartMonth",
} as const satisfies Record<keyof CompanyValues, string>

/** The PATCH /company/settings body: only the fields that changed, in API form. */
export function settingsChange(before: CompanyValues, after: CompanyValues) {
  const body: Record<string, unknown> = {}
  for (const field of Object.keys(SETTINGS_FIELDS) as (keyof CompanyValues)[]) {
    if (String(before[field]) === String(after[field])) continue
    body[SETTINGS_FIELDS[field]] =
      field === "workingDays"
        ? [...after.workingDays].sort().map((day) => WEEKDAYS[day])
        : after[field]
  }
  return body
}
