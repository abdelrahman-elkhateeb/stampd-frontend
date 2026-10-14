import { describe, expect, it } from "vitest"

import ar from "@/messages/ar.json"
import en from "@/messages/en.json"

import { getDirection, getIntlLocale } from "@/i18n/locale"

const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/

describe("getDirection", () => {
  it("is rtl for Arabic and ltr for English", () => {
    expect(getDirection("ar")).toBe("rtl")
    expect(getDirection("en")).toBe("ltr")
  })
})

describe("getIntlLocale", () => {
  it("formats Arabic numbers, dates and times with Latin digits", () => {
    const locale = getIntlLocale("ar")
    const number = new Intl.NumberFormat(locale).format(1240.5)
    const date = new Intl.DateTimeFormat(locale, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
    }).format(new Date("2026-10-06T05:02:00Z"))

    expect(number).not.toMatch(ARABIC_INDIC_DIGITS)
    expect(date).not.toMatch(ARABIC_INDIC_DIGITS)
    expect(date).toContain("2026")
  })

  it("uses the Gregorian calendar for Arabic", () => {
    const date = new Intl.DateTimeFormat(getIntlLocale("ar"), {
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date("2026-10-06T00:00:00Z"))
    expect(date).toContain("2026")
  })
})

type Messages = { [key: string]: string | Messages }

function keys(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string" ? [prefix + key] : keys(value, `${prefix}${key}.`)
  )
}

describe("message catalogs", () => {
  it("have the same keys in English and Arabic", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort())
  })
})
