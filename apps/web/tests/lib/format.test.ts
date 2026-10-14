import { describe, expect, it } from "vitest"

import {
  formatDay,
  formatDayRange,
  formatDuration,
  formatNumber,
  formatTime,
  isPlainDate,
} from "@/lib/format"

// vitest.config.mts runs the suite with TZ=America/Los_Angeles: if a plain day were
// formatted in the machine timezone instead of UTC, these assertions would fail.
const ARABIC_INDIC = /[٠-٩]/

describe("plain calendar days never shift", () => {
  it("shows 7 Oct for 2026-10-07 whatever the machine timezone", () => {
    expect(formatDay("2026-10-07", "en")).toBe("Wed 7 Oct")
    expect(formatDay("2026-10-07", "en", "numeric")).toBe("07/10/2026")
    // Arabic adds invisible right-to-left marks around the separators.
    expect(formatDay("2026-10-07", "ar", "numeric").replaceAll("‏", "")).toBe(
      "07/10/2026"
    )
  })

  it("formats ranges with formatRange", () => {
    expect(formatDayRange("2026-10-11", "2026-10-15", "en")).toMatch(
      /^11\s?–\s?15 Oct$/
    )
  })

  it("rejects timestamps passed as calendar days", () => {
    expect(isPlainDate("2026-10-07")).toBe(true)
    expect(isPlainDate("2026-10-07T00:00:00Z")).toBe(false)
    expect(() => formatDay("2026-10-07T00:00:00Z", "en")).toThrow(RangeError)
  })
})

describe("numbers and digits", () => {
  it("groups numbers with Latin digits in both languages", () => {
    expect(formatNumber(1240.5, "en")).toBe("1,240.5")
    expect(formatNumber(1240.5, "ar")).not.toMatch(ARABIC_INDIC)
  })
})

describe("test setup", () => {
  it("runs in a timezone that is neither UTC nor Riyadh", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
      "America/Los_Angeles"
    )
  })
})

describe("times and durations", () => {
  it("shows instants in company time, 24-hour", () => {
    expect(formatTime("2026-10-08T05:02:00Z", "en", "Asia/Riyadh")).toBe(
      "08:02"
    )
    expect(formatTime("2026-10-08T14:30:00Z", "ar", "Asia/Riyadh")).toBe(
      "17:30"
    )
  })

  it("omits a zero part of a duration", () => {
    expect(formatDuration(465, "en")).toBe("7h 45m")
    expect(formatDuration(480, "en")).toBe("8h")
    expect(formatDuration(45, "en")).toBe("45m")
    expect(formatDuration(0, "en")).toBe("0m")
    expect(formatDuration(465, "ar")).toBe("7س 45د")
  })
})
