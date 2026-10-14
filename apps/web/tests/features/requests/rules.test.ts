import { describe, expect, it } from "vitest"

import type { RequestType } from "@/features/requests/request-data"
import {
  buildSchema,
  formFieldNames,
  initialValues,
  toRequestBody,
  unsupportedFields,
} from "@/features/requests/rules"
import { codeErrorMap } from "@/lib/forms"

// As GET /requests/types sends them (BE-11).
const base: Omit<RequestType, "key" | "dates"> = {
  label: "",
  enabled: true,
  approverPolicy: "MANAGER_WITH_ADMIN_FALLBACK",
  times: "NONE",
  reason: "OPTIONAL",
  fields: [],
}
const WFH: RequestType = { ...base, key: "WFH", dates: "RANGE" }
const PERMISSION: RequestType = {
  ...base,
  key: "PERMISSION",
  dates: "SINGLE_DAY",
  times: "REQUIRED",
}
const TRIP: RequestType = {
  ...base,
  key: "BUSINESS_TRIP",
  dates: "RANGE",
  fields: [
    { name: "destination", kind: "text", required: true, maxLength: 100 },
    { name: "purpose", kind: "text", required: true, maxLength: 500 },
  ],
}
const CORRECTION: RequestType = {
  ...base,
  key: "ATTENDANCE_CORRECTION",
  approverPolicy: "ADMIN_ONLY",
  dates: "SINGLE_DAY",
  reason: "REQUIRED",
  fields: [
    { name: "checkInTime", kind: "time", required: false },
    { name: "checkOutTime", kind: "time", required: false },
  ],
}

function errors(type: RequestType, values: object) {
  const result = buildSchema(type).safeParse(
    { ...initialValues(type), ...values },
    codeErrorMap
  )
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ])
      )
}

describe("buildSchema", () => {
  it("accepts a WFH range with no reason", () => {
    expect(
      errors(WFH, { dates: { from: "2026-10-18", to: "2026-10-19" } })
    ).toEqual({})
  })

  it("asks for a whole range, and the type's required fields", () => {
    expect(
      errors(TRIP, { dates: { from: "2026-10-18", to: null }, purpose: "x" })
    ).toEqual({ dates: "REQUIRED", destination: "REQUIRED" })
  })

  it("needs both times, the end after the start", () => {
    expect(errors(PERMISSION, { startDate: "2026-10-20" })).toEqual({
      startTime: "REQUIRED",
      endTime: "REQUIRED",
    })
    expect(
      errors(PERMISSION, {
        startDate: "2026-10-20",
        startTime: "15:00",
        endTime: "14:00",
      })
    ).toEqual({ endTime: "END_BEFORE_START" })
  })

  it("follows the type's reason rule", () => {
    expect(
      errors(CORRECTION, { startDate: "2026-10-13", reason: " " })
    ).toEqual({
      reason: "REQUIRED",
    })
  })
})

describe("unsupportedFields", () => {
  it("fails closed on kinds the form can't render", () => {
    const future = {
      ...WFH,
      fields: [{ name: "file", kind: "upload", required: true }],
    }
    expect(unsupportedFields(future)).toHaveLength(1)
    expect(unsupportedFields(TRIP)).toHaveLength(0)
  })
})

describe("toRequestBody", () => {
  it("sends a single day as start and end, type fields in data", () => {
    expect(
      toRequestBody(CORRECTION, {
        startDate: "2026-10-13",
        reason: " Forgot ",
        checkInTime: "",
        checkOutTime: "17:00",
      })
    ).toEqual({
      type: "ATTENDANCE_CORRECTION",
      startDate: "2026-10-13",
      endDate: "2026-10-13",
      reason: "Forgot",
      data: { checkInTime: null, checkOutTime: "17:00" },
    })
  })

  it("maps the API's field errors back onto the form", () => {
    expect(formFieldNames(TRIP)).toEqual({
      startDate: "dates",
      endDate: "dates",
      "data.destination": "destination",
      "data.purpose": "purpose",
    })
  })
})
