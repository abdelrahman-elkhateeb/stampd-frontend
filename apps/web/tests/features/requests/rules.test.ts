import { describe, expect, it } from "vitest"

import { codeErrorMap } from "@/lib/forms"

import {
  DEMO_REQUEST_TYPES,
  demoRequests,
  type RequestTypeMeta,
} from "@/features/requests/demo-data"
import {
  buildSchema,
  findLeaveConflict,
  unsupportedFields,
} from "@/features/requests/rules"

const TODAY = "2026-10-11"
const type = (key: string) => DEMO_REQUEST_TYPES.find((t) => t.key === key)!
const requests = demoRequests(TODAY)

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
