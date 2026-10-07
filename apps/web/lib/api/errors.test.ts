import { describe, expect, it } from "vitest"

import { apiErrorFromResponse, isApiError } from "./errors"

function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  })
}

describe("apiErrorFromResponse", () => {
  it("reads the contract's error shape, field errors and request ID", async () => {
    const error = await apiErrorFromResponse(
      json(
        422,
        {
          code: "VALIDATION_FAILED",
          message: "Validation failed",
          fieldErrors: [
            { field: "email", code: "REQUIRED", message: "email is required" },
          ],
        },
        { "x-request-id": "req-123" }
      )
    )

    expect(error.status).toBe(422)
    expect(error.code).toBe("VALIDATION_FAILED")
    expect(error.fieldErrors).toEqual([
      { field: "email", code: "REQUIRED", message: "email is required" },
    ])
    expect(error.requestId).toBe("req-123")
  })

  it("falls back to a code from the status when the body isn't the contract shape", async () => {
    expect(
      (await apiErrorFromResponse(new Response("<html>", { status: 502 }))).code
    ).toBe("INTERNAL_ERROR")
    expect(
      (await apiErrorFromResponse(json(403, { error: "nope" }))).code
    ).toBe("FORBIDDEN")
  })

  it("ignores codes the contract doesn't know", async () => {
    expect(
      (await apiErrorFromResponse(json(401, { code: "SOMETHING_NEW" }))).code
    ).toBe("UNAUTHENTICATED")
  })
})

describe("isApiError", () => {
  it("recognises instances and plain objects with the same shape", async () => {
    const error = await apiErrorFromResponse(
      json(404, { code: "NOT_FOUND", message: "" })
    )
    expect(isApiError(error)).toBe(true)
    expect(isApiError({ name: "ApiError", status: 403 })).toBe(true)
    expect(isApiError(new Error("boom"))).toBe(false)
  })
})
