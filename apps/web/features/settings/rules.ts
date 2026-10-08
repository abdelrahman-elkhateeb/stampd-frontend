import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"

import type {
  ApprovedRequest,
  CompanySettings,
  SettingsChange,
} from "./demo-data"

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** WCAG contrast ratio between two 6-digit hex colours. */
export function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high! + 0.05) / (low! + 0.05)
}

/** Themes where the accent ring needs an extra outline (layout.md › Accent validation). */
export function accentOutline(accent: string) {
  return {
    light: contrast(accent, "#FFFDF9") < 3,
    dark: contrast(accent, "#1F1C17") < 3,
  }
}

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

/** Approved requests that include the day (plain dates compare as strings). */
export function affectedRequests(day: PlainDate, requests: ApprovedRequest[]) {
  return requests.filter((request) => request.from <= day && day <= request.to)
}

/** The fields that changed, for the settings history (BE-04 records this server-side). */
export function settingsDiff(
  before: CompanySettings,
  after: CompanySettings
): SettingsChange["fields"] {
  return (Object.keys(after) as (keyof CompanySettings)[])
    .filter((field) => String(before[field]) !== String(after[field]))
    .map((field) => ({ field, from: before[field], to: after[field] }))
}
