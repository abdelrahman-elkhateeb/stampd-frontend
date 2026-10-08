import { describe, expect, it } from "vitest"

import { canAccess } from "./access"

describe("canAccess", () => {
  it("opens the Me section to everyone", () => {
    expect(canAccess("employee", "/")).toBe(true)
    expect(canAccess("employee", "/leave/new")).toBe(true)
    expect(canAccess("employee", "/me")).toBe(true)
  })

  it("keeps My team for managers and admins", () => {
    expect(canAccess("employee", "/approvals")).toBe(false)
    expect(canAccess("employee", "/team/42")).toBe(false)
    expect(canAccess("manager", "/team/42")).toBe(true)
    expect(canAccess("admin", "/approvals")).toBe(true)
  })

  it("keeps Company for admins", () => {
    expect(canAccess("manager", "/employees")).toBe(false)
    expect(canAccess("employee", "/settings/holidays")).toBe(false)
    expect(canAccess("admin", "/employees/7")).toBe(true)
  })

  it("matches whole segments only", () => {
    expect(canAccess("employee", "/teams")).toBe(true)
    expect(canAccess("employee", "/reports-archive")).toBe(true)
  })
})
