import { describe, expect, it } from "vitest"

import { codeErrorMap } from "@/lib/forms"

import {
  DEMO_REQUEST_TYPES,
  demoRequests,
  type RequestTypeMeta,
} from "@/features/requests/demo-data"
import {
  allowedActions,
  buildSchema,
  canView,
  findLeaveConflict,
  queryRequests,
  unsupportedFields,
  type RequestFilters,
} from "@/features/requests/rules"

const TODAY = "2026-10-11"
const type = (key: string) => DEMO_REQUEST_TYPES.find((t) => t.key === key)!
const requests = demoRequests(TODAY)
const byId = (id: string) => requests.find((r) => r.id === id)!
const employee = { id: "u-sara", role: "employee" as const }
const admin = { id: "u-sara", role: "admin" as const }

function errors(meta: RequestTypeMeta, values: object, isAdmin = false) {
  const result = buildSchema(meta, { today: TODAY, admin: isAdmin }).safeParse(
    values,
    codeErrorMap
  )
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message])
      )
}

describe("buildSchema", () => {
  it("accepts a valid WFH request", () => {
    expect(
      errors(type("wfh"), {
        dates: { from: "2026-10-12", to: "2026-10-12" },
        reason: "Delivery",
      })
    ).toEqual({})
  })

  it("asks for a whole range and a reason", () => {
    expect(
      errors(type("wfh"), {
        dates: { from: "2026-10-12", to: null },
        reason: " ",
      })
    ).toEqual({ dates: "REQUIRED", reason: "REQUIRED" })
  })

  it("refuses past WFH days for employees, but not for admins", () => {
    const past = {
      dates: { from: "2026-10-01", to: "2026-10-02" },
      reason: "x",
    }
    expect(errors(type("wfh"), past)).toEqual({ dates: "BEFORE_TODAY" })
    expect(errors(type("wfh"), past, true)).toEqual({})
  })

  it("needs the end time after the start time", () => {
    expect(
      errors(type("permission"), {
        date: TODAY,
        from: "15:00",
        to: "14:00",
        reason: "x",
      })
    ).toEqual({ to: "END_BEFORE_START" })
  })

  it("keeps corrections to today or earlier", () => {
    expect(
      errors(type("correction"), {
        date: "2026-10-12",
        checkIn: "08:00",
        checkOut: "17:00",
        reason: "x",
      })
    ).toEqual({ date: "AFTER_TODAY" })
  })

  it("fails closed on field types it can't render", () => {
    const future = {
      ...type("wfh"),
      fields: [{ key: "file", type: "upload", label: { en: "File" } }],
    }
    expect(unsupportedFields(future)).toHaveLength(1)
    expect(unsupportedFields(type("trip"))).toHaveLength(0)
  })
})

describe("findLeaveConflict", () => {
  const context = {
    employeeId: "u-sara",
    requests,
    types: DEMO_REQUEST_TYPES,
  }

  it("flags WFH on a day of approved leave", () => {
    // Annual leave 2033 runs from day +12 to +15.
    expect(
      findLeaveConflict(
        type("wfh"),
        { dates: { from: "2026-10-20", to: "2026-10-24" }, reason: "x" },
        context
      )
    ).toEqual({ field: "dates", day: "2026-10-23" })
  })

  it("lets WFH through on free days and ignores other people's leave", () => {
    const values = {
      dates: { from: "2026-10-18", to: "2026-10-19" },
      reason: "x",
    }
    expect(findLeaveConflict(type("wfh"), values, context)).toBeNull()
    expect(
      findLeaveConflict(
        type("wfh"),
        { dates: { from: "2026-10-23", to: "2026-10-23" } },
        { ...context, employeeId: "e-3" }
      )
    ).toBeNull()
  })
})

describe("allowedActions", () => {
  it("withdraws pending, cancels future approved, and nothing on decided", () => {
    expect(allowedActions(byId("2041"), type("wfh"), employee, TODAY)).toEqual([
      "withdraw",
    ])
    expect(
      allowedActions(byId("2033"), type("leave"), employee, TODAY)
    ).toEqual(["requestCancellation"])
    expect(
      allowedActions(byId("2027"), type("permission"), employee, TODAY)
    ).toEqual([])
  })

  it("offers no cancel once approved leave has started, except to an admin", () => {
    expect(
      allowedActions(byId("2008"), type("leave"), employee, TODAY)
    ).toEqual([])
    expect(allowedActions(byId("2008"), type("leave"), admin, TODAY)).toEqual([
      "adminCancel",
    ])
  })
})

describe("canView", () => {
  it("hides other people's requests from everyone but admins", () => {
    expect(canView(byId("1990"), employee)).toBe(false)
    expect(canView(byId("1990"), { id: "u-sara", role: "manager" })).toBe(false)
    expect(canView(byId("1990"), admin)).toBe(true)
  })
})

describe("queryRequests", () => {
  const all: RequestFilters = { types: [], statuses: [], from: null, to: null }

  it("lists only mine, newest first", () => {
    const ids = queryRequests(requests, DEMO_REQUEST_TYPES, "u-sara", all).map(
      (r) => r.id
    )
    expect(ids).toEqual(["2041", "2008", "2027", "2033", "2019", "2012"])
  })

  it("filters by type, status and overlapping dates", () => {
    const ids = (filters: Partial<typeof all>) =>
      queryRequests(requests, DEMO_REQUEST_TYPES, "u-sara", {
        ...all,
        ...filters,
      }).map((r) => r.id)
    expect(ids({ types: ["wfh"] })).toEqual(["2041", "2012"])
    expect(ids({ statuses: ["approved"] })).toEqual(["2008", "2033", "2019"])
    expect(ids({ from: "2026-10-12", to: "2026-10-13" })).toEqual([
      "2041",
      "2008",
    ])
  })
})
