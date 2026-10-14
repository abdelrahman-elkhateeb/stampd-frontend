import { describe, expect, it } from "vitest"

import {
  addMonths,
  companyDate,
  monthGrid,
  monthSummary,
  toAttendanceStatus,
  toFlags,
  workedMinutes,
} from "@/features/attendance/rules"

const riyadh = (time: string) => `2026-10-08T${time}:00+03:00`

describe("company time", () => {
  it("puts an instant on the company's calendar day", () => {
    // 01:00 in Riyadh is still the previous day in UTC.
    expect(companyDate(new Date(riyadh("01:00")), "Asia/Riyadh")).toBe(
      "2026-10-08"
    )
  })
})

describe("workedMinutes", () => {
  it("adds closed sessions and the open one up to now", () => {
    const sessions = [
      { in: riyadh("08:00"), out: riyadh("12:00") },
      { in: riyadh("13:00") },
    ]
    expect(workedMinutes(sessions, Date.parse(riyadh("14:30")))).toBe(330)
    // A past day left open doesn't keep counting.
    expect(workedMinutes(sessions, null)).toBe(240)
  })
})

describe("API mapping", () => {
  it("maps statuses and the flags the app shows", () => {
    expect(toAttendanceStatus("MISSING_CHECKOUT")).toBe("missing")
    expect(toAttendanceStatus("ON_LEAVE")).toBe("leave")
    expect(toAttendanceStatus(null)).toBe(null)
    expect(toFlags(["CORRECTED", "WORKED_DURING_TIME_OFF"])).toEqual([
      "corrected",
    ])
  })
})

describe("history", () => {
  it("lays a month out in whole weeks from the company week start", () => {
    const grid = monthGrid("2026-10", 0)
    expect(grid.length % 7).toBe(0)
    // 1 Oct 2026 is a Thursday: four blanks from Sunday.
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"])
    expect(grid.filter(Boolean)).toHaveLength(31)
    expect(addMonths("2026-01", -1)).toBe("2025-12")
  })

  it("sums the month", () => {
    expect(
      monthSummary([
        { status: "present", worked: 480 },
        { status: "late", worked: 450 },
        { status: "absent", worked: 0 },
        { status: "weekend", worked: 0 },
      ])
    ).toEqual({ attended: 2, late: 1, absent: 1, worked: 930 })
  })
})
