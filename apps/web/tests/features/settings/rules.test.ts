import { describe, expect, it } from "vitest"

import { DEMO_APPROVED_REQUESTS, DEMO_COMPANY } from "@/features/settings/demo-data"
import {
  accentOutline,
  affectedRequests,
  contrast,
  settingsDiff,
  workingDaysSummary,
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

describe("accent contrast", () => {
  it("matches WCAG for black and white", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21)
  })

  it("outlines the default butter in light mode only", () => {
    expect(accentOutline("#F9DC5C")).toEqual({ light: true, dark: false })
    expect(accentOutline("#1D4ED8")).toEqual({ light: false, dark: true })
  })
})

describe("affectedRequests", () => {
  it("finds approved requests that include the holiday", () => {
    expect(
      affectedRequests("2026-10-20", DEMO_APPROVED_REQUESTS).map((r) => r.id)
    ).toEqual(["1042", "1057"])
    expect(affectedRequests("2026-10-22", DEMO_APPROVED_REQUESTS)).toHaveLength(
      1
    )
    expect(affectedRequests("2026-10-23", DEMO_APPROVED_REQUESTS)).toEqual([])
  })
})

describe("settingsDiff", () => {
  it("lists only changed fields", () => {
    const after = {
      ...DEMO_COMPANY,
      graceMinutes: 5,
      workingDays: [1, 2, 3, 4, 5] as typeof DEMO_COMPANY.workingDays,
    }
    expect(settingsDiff(DEMO_COMPANY, after).map((f) => f.field)).toEqual([
      "workingDays",
      "graceMinutes",
    ])
    expect(settingsDiff(DEMO_COMPANY, { ...DEMO_COMPANY })).toEqual([])
  })
})
