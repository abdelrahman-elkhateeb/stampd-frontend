import { describe, expect, it, vi } from "vitest"

import { LoginBody } from "@/api/generated/zod/auth/auth"

import { ApiError } from "./api/errors"
import {
  apiToFormErrors,
  applyFormErrors,
  codeErrorMap,
  zodToFormErrors,
} from "./forms"

describe("Zod issues become field codes", () => {
  it("maps empty fields to REQUIRED and bad formats to INVALID_FORMAT", () => {
    const empty = LoginBody.safeParse({ email: "", password: "" }, codeErrorMap)
    expect(empty.success).toBe(false)
    expect(zodToFormErrors(empty.error!)).toEqual({
      fieldErrors: { email: "REQUIRED", password: "REQUIRED" },
    })

    const badEmail = LoginBody.safeParse(
      { email: "sara", password: "x" },
      codeErrorMap
    )
    expect(zodToFormErrors(badEmail.error!)).toEqual({
      fieldErrors: { email: "INVALID_FORMAT" },
    })
  })
})

describe("API errors become form errors", () => {
  it("sends field errors to their fields", () => {
    const error = new ApiError(422, "VALIDATION_FAILED", [
      { field: "email", code: "ALREADY_EXISTS", message: "taken" },
    ])
    expect(apiToFormErrors(error)).toEqual({
      fieldErrors: { email: "ALREADY_EXISTS" },
    })
  })

  it("sends everything else to the form", () => {
    expect(apiToFormErrors(new ApiError(401, "INVALID_CREDENTIALS"))).toEqual({
      formError: "INVALID_CREDENTIALS",
    })
    expect(apiToFormErrors(new Error("boom"))).toEqual({ formError: "UNKNOWN" })
  })

  it("puts them on react-hook-form and focuses the first invalid field", () => {
    const setError = vi.fn()
    applyFormErrors(setError, {
      fieldErrors: { email: "REQUIRED", password: "TOO_SHORT" },
      formError: "VALIDATION_FAILED",
    })
    expect(setError.mock.calls).toEqual([
      ["email", { type: "server", message: "REQUIRED" }, { shouldFocus: true }],
      [
        "password",
        { type: "server", message: "TOO_SHORT" },
        { shouldFocus: false },
      ],
      ["root.server", { type: "server", message: "VALIDATION_FAILED" }],
    ])
  })
})
