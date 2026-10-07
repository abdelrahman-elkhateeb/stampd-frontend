import { describe, expect, it } from "vitest"

import { inLocale, safeReturnTo } from "./return-to"

describe("safeReturnTo", () => {
  it("keeps same-site paths with their query", () => {
    expect(safeReturnTo("/ar/leave?tab=history")).toBe("/ar/leave?tab=history")
  })

  it.each([
    "https://evil.example",
    "//evil.example",
    String.raw`/\evil.example`,
    "javascript:alert(1)",
    "",
  ])("rejects %s", (value) => {
    expect(safeReturnTo(value, "/en")).toBe("/en")
  })
})

describe("inLocale", () => {
  it("swaps the locale prefix and keeps the rest", () => {
    expect(inLocale("/en/leave?tab=history", "ar", ["en", "ar"])).toBe(
      "/ar/leave?tab=history"
    )
    expect(inLocale("/en", "ar", ["en", "ar"])).toBe("/ar")
  })

  it("leaves paths without a locale alone", () => {
    expect(inLocale("/settings", "ar", ["en", "ar"])).toBe("/settings")
  })
})
