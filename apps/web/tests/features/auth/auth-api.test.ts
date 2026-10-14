import { describe, expect, it, vi } from "vitest"

import { safeReturnTo } from "@/features/auth/auth-api"

// Only the pure helper is tested; lib/api pulls in next-intl navigation.
vi.mock("@/lib/api", () => ({}))

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
