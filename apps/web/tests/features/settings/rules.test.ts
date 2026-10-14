import { describe, expect, it } from "vitest"

import {
  settingsChange,
  workingDaysSummary,
  type CompanyValues,
} from "@/features/settings/rules"

const NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

describe("workingDaysSummary", () => {
  it("shows a run of days as a range in week order", () => {
    expect(workingDaysSummary([4, 0, 2, 1, 3], 0, NAMES)).toBe("Sun–Thu")
    expect(workingDaysSummary([1, 2, 3, 4, 5], 1, NAMES)).toBe("Mon–Fri")
  })

  it("lists days that aren't a run, or short runs", () => {
    expect(workingDaysSummary([0, 2, 4], 0, NAMES)).toBe("Sun, Tue, Thu")
    expect(workingDaysSummary([0, 1], 0, NAMES)).toBe("Sun, Mon")
  })

  it("wraps around the week start", () => {
    expect(workingDaysSummary([6, 0, 1, 2, 3], 6, NAMES)).toBe("Sat–Wed")
  })
})

describe("settingsChange", () => {
  const company: CompanyValues = {
    name: "Demo",
    timezone: "Asia/Riyadh",
    workingDays: [0, 1, 2, 3, 4],
    workStart: "09:00",
    workEnd: "17:00",
    graceMinutes: 0,
    leaveYearStartMonth: 1,
  }

  it("sends only changed fields, under the API's names", () => {
    expect(
      settingsChange(company, {
        ...company,
        graceMinutes: 5,
        workingDays: [5, 1, 2, 3, 4],
      })
    ).toEqual({
      workingDays: ["MON", "TUE", "WED", "THU", "FRI"],
      lateGraceMinutes: 5,
    })
    expect(settingsChange(company, { ...company })).toEqual({})
  })
})
