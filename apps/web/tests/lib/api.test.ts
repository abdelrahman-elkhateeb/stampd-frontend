import { describe, expect, it } from "vitest"

import { toApiError } from "@/lib/api-error"
import { secondsLeft } from "@/lib/session"

const jwt = (payload: object) =>
  `h.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.s`

describe("toApiError", () => {
  it("reads code, field errors and the request id (as the support code)", async () => {
    const error = await toApiError(
      Response.json(
        {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
          fieldErrors: [
            { field: "email", code: "ALREADY_EXISTS", message: "" },
          ],
        },
        { status: 422, headers: { "X-Request-Id": "req-42" } }
      )
    )
    expect(error).toMatchObject({
      status: 422,
      code: "VALIDATION_FAILED",
      fieldErrors: [{ field: "email", code: "ALREADY_EXISTS" }],
      digest: "req-42",
    })
  })

  it("survives a body that isn't the API's JSON", async () => {
    const error = await toApiError(
      new Response("<html>Bad gateway</html>", { status: 502 })
    )
    expect(error).toMatchObject({
      status: 502,
      code: "INTERNAL_ERROR",
      fieldErrors: [],
    })
  })
})

describe("secondsLeft", () => {
  const now = 1_000_000_000_000

  it("counts down to the token's exp", () => {
    expect(secondsLeft(jwt({ exp: now / 1000 + 90 }), now)).toBe(90)
  })

  it("treats missing or malformed tokens as expired", () => {
    expect(secondsLeft(undefined, now)).toBe(0)
    expect(secondsLeft("not-a-jwt", now)).toBe(0)
    expect(secondsLeft(jwt({ sub: "u" }), now)).toBe(0)
  })
})
