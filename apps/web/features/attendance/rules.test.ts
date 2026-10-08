import { describe, expect, it } from "vitest"

import { demoHistory, demoRules } from "./demo-data"
import {
  addMonths,
  checkIn,
  checkOut,
  companyDate,
  companyInstant,
  dayStatus,
  missedCheckout,
  monthGrid,
  monthSummary,
  workedMinutes,
} from "./rules"

// 2026-10-08 is a Thursday; Riyadh is UTC+3 all year.
const rules = demoRules("2026-10-08")
const riyadh = (day: string, time: string) =>
  companyInstant(day as "2026-10-08", time, "Asia/Riyadh")

describe("company time", () => {
  it("turns wall-clock times into instants and back", () => {
    expect(riyadh("2026-10-08", "08:02")).toBe("2026-10-08T05:02:00.000Z")
    // 01:00 in Riyadh is still the previous day in UTC.
    expect(
      companyDate(new Date(riyadh("2026-10-08", "01:00")), "Asia/Riyadh")
    ).toBe("2026-10-08")
  })
})

describe("workedMinutes", () => {
  it("adds closed sessions and the open one up to now", () => {
    const sessions = [
      { in: riyadh("2026-10-08", "08:00"), out: riyadh("2026-10-08", "12:00") },
      { in: riyadh("2026-10-08", "13:00") },
    ]
    expect(
      workedMinutes(sessions, Date.parse(riyadh("2026-10-08", "14:30")))
    ).toBe(330)
    // A past day left open doesn't keep counting.
    expect(workedMinutes(sessions, null)).toBe(240)
  })
})

describe("dayStatus", () => {
  const worked = (start: string, end?: string) => ({
    date: "2026-10-07" as const,
    sessions: [
      {
        in: riyadh("2026-10-07", start),
        out: end && riyadh("2026-10-07", end),
      },
    ],
  })

  it("is late only after the grace period", () => {
    expect(dayStatus("2026-10-07", worked("08:15", "17:00"), rules)).toBe(
      "present"
    )
    expect(dayStatus("2026-10-07", worked("08:16", "17:00"), rules)).toBe(
      "late"
    )
  })

  it("flags a past day left open", () => {
    expect(dayStatus("2026-10-07", worked("08:00"), rules)).toBe("missing")
  })

  it("names days without work", () => {
    expect(dayStatus("2026-10-07", undefined, rules)).toBe("absent")
    expect(dayStatus("2026-10-08", undefined, rules)).toBe("not-yet")
    expect(dayStatus("2026-10-09", undefined, rules)).toBe(null) // future
    expect(dayStatus("2026-10-03", undefined, rules)).toBe("weekend") // Saturday
    expect(dayStatus("2026-09-23", undefined, rules)).toBe("holiday")
    expect(
      dayStatus(
        "2026-10-07",
        { date: "2026-10-07", sessions: [], leave: true },
        rules
      )
    ).toBe("leave")
  })
})

describe("check in and out", () => {
  it("never opens two sessions", () => {
    const first = checkIn([], "2026-10-08", riyadh("2026-10-08", "08:00"))
    expect(() =>
      checkIn(first, "2026-10-08", riyadh("2026-10-08", "08:01"))
    ).toThrow("ALREADY_CHECKED_IN")
    const closed = checkOut(first, "2026-10-08", riyadh("2026-10-08", "12:00"))
    expect(closed[0]?.sessions).toHaveLength(1)
    expect(() =>
      checkOut(closed, "2026-10-08", riyadh("2026-10-08", "12:01"))
    ).toThrow("NOT_CHECKED_IN")
    expect(
      checkIn(closed, "2026-10-08", riyadh("2026-10-08", "13:00"))[0]?.sessions
    ).toHaveLength(2)
  })
})

describe("history", () => {
  it("warns about the last day left open", () => {
    const history = demoHistory(rules)
    expect(missedCheckout(history, rules)).toBe("2026-10-07")
  })

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
