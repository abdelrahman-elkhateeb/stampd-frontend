import { describe, expect, it } from "vitest"

import {
  formatDateTime,
  formatDay,
  formatDayRange,
  formatDuration,
  formatNumber,
  formatRelative,
  formatTime,
  isPlainDate,
  normalizeDigits,
  todayInZone,
} from "./format"

// vitest.config.mts runs the suite with TZ=America/Los_Angeles: if anything here used
// the machine timezone instead of the company's, these assertions would fail.
const riyadhEn = { locale: "en", timeZone: "Asia/Riyadh" } as const
const riyadhAr = { locale: "ar", timeZone: "Asia/Riyadh" } as const
const ARABIC_INDIC = /[٠-٩]/

describe("timestamps use company time", () => {
  const checkIn = "2026-10-06T05:02:00Z" // 08:02 in Riyadh (UTC+3)

  it("formats times in the company timezone, 24-hour", () => {
    expect(formatTime(checkIn, riyadhEn)).toBe("08:02")
    expect(formatTime(checkIn, riyadhAr)).toBe("08:02")
  })

  it("puts late-night UTC timestamps on the company's calendar day", () => {
    // 22:30 UTC on the 6th is already the 7th in Riyadh.
    expect(formatDateTime("2026-10-06T22:30:00Z", riyadhEn)).toBe("Wed 7 Oct")
  })

  it("never uses Arabic-Indic digits in Arabic", () => {
    expect(formatDateTime(checkIn, riyadhAr, "long")).not.toMatch(ARABIC_INDIC)
    expect(formatDateTime(checkIn, riyadhAr, "long")).toContain("2026")
  })
})

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

describe("todayInZone", () => {
  it("returns the company's date, not the device's", () => {
    const now = new Date("2026-10-06T22:30:00Z") // still the 6th in Los Angeles
    expect(todayInZone("Asia/Riyadh", now)).toBe("2026-10-07")
    expect(todayInZone("America/Los_Angeles", now)).toBe("2026-10-06")
  })
})

describe("formatDuration", () => {
  it.each([
    [465, "en", "7h 45m"],
    [480, "en", "8h"],
    [45, "en", "45m"],
    [0, "en", "0m"],
    [465, "ar", "7س 45د"],
  ] as const)("%i minutes in %s → %s", (minutes, locale, expected) => {
    expect(formatDuration(minutes, locale)).toBe(expected)
  })
})

describe("formatRelative", () => {
  const now = new Date("2026-10-06T12:00:00Z")
  const ago = (seconds: number) =>
    new Date(now.getTime() - seconds * 1000).toISOString()

  it("follows the just now → minutes → hours → yesterday → date ladder", () => {
    expect(formatRelative(ago(20), riyadhEn, now)).toBe("just now")
    expect(formatRelative(ago(120), riyadhEn, now)).toBe("2 min ago")
    expect(formatRelative(ago(3 * 3600), riyadhEn, now)).toBe("3 hr ago")
    expect(formatRelative("2026-10-05T12:00:00Z", riyadhEn, now)).toBe(
      "yesterday"
    )
    expect(formatRelative("2026-10-01T12:00:00Z", riyadhEn, now)).toBe(
      "Thu 1 Oct"
    )
  })

  it("uses Arabic phrasing with Latin digits", () => {
    expect(formatRelative(ago(3 * 3600), riyadhAr, now)).not.toMatch(
      ARABIC_INDIC
    )
    expect(formatRelative("2026-10-05T12:00:00Z", riyadhAr, now)).toBe("أمس")
  })
})

describe("numbers and digits", () => {
  it("groups numbers with Latin digits in both languages", () => {
    expect(formatNumber(1240.5, "en")).toBe("1,240.5")
    expect(formatNumber(1240.5, "ar")).not.toMatch(ARABIC_INDIC)
  })

  it("normalises Arabic-Indic and Persian digits to ASCII", () => {
    expect(normalizeDigits("٠٨:٠٢")).toBe("08:02")
    expect(normalizeDigits("۱۲۳")).toBe("123")
  })
})

describe("test setup", () => {
  it("runs in a timezone that is neither UTC nor Riyadh", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(
      "America/Los_Angeles"
    )
  })
})
