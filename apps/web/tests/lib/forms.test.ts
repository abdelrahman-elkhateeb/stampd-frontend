import type { UseFormReturn } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { codeErrorMap, showProblem } from "@/lib/forms"

const schema = z.object({ email: z.email(), password: z.string().min(8) })
const codes = (input: object) =>
  schema
    .safeParse(input, codeErrorMap)
    .error?.issues.map((issue) => [issue.path[0], issue.message])

describe("Zod issues become field codes", () => {
  it("maps empty to REQUIRED, bad format and short values to their codes", () => {
    expect(codes({ email: "", password: "" })).toEqual([
      ["email", "REQUIRED"],
      ["password", "REQUIRED"],
    ])
    expect(codes({ email: "sara", password: "x" })).toEqual([
      ["email", "INVALID_FORMAT"],
      ["password", "TOO_SHORT"],
    ])
  })
})

function fakeForm(values: object) {
  const setError = vi.fn()
  const form = { getValues: () => values, setError } as unknown as UseFormReturn
  return { form, setError }
}

describe("showProblem", () => {
  it("puts field errors under their (renamed) fields", () => {
    const { form, setError } = fakeForm({ email: "", terms: false })
    showProblem(
      form,
      {
        code: "VALIDATION_FAILED",
        fieldErrors: [
          { field: "email", code: "ALREADY_EXISTS", message: "" },
          { field: "acceptTerms", code: "REQUIRED", message: "" },
        ],
      },
      { acceptTerms: "terms" }
    )
    expect(setError.mock.calls).toEqual([
      ["email", { message: "ALREADY_EXISTS" }],
      ["terms", { message: "REQUIRED" }],
    ])
  })

  it("falls back to the root error when no field is on the form", () => {
    const { form, setError } = fakeForm({ email: "" })
    showProblem(form, {
      code: "VALIDATION_FAILED",
      fieldErrors: [{ field: "token", code: "REQUIRED", message: "" }],
    })
    expect(setError.mock.calls).toEqual([
      ["root", { message: "VALIDATION_FAILED" }],
    ])
  })
})
