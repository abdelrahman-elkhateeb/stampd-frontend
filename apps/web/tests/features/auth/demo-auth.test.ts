import { describe, expect, it } from "vitest"

import { safeReturnTo } from "@/features/auth/demo-auth"

describe("safeReturnTo", () => {
  it("keeps same-site paths and drops everything else", () => {
    expect(safeReturnTo("/leave?tab=history")).toBe("/leave?tab=history")
    expect(safeReturnTo("//evil.example")).toBe("/")
    expect(safeReturnTo("/\\evil.example")).toBe("/")
    expect(safeReturnTo("https://evil.example")).toBe("/")
    expect(safeReturnTo(["/a", "/b"])).toBe("/")
    expect(safeReturnTo(undefined)).toBe("/")
  })
})
