import { describe, expect, it } from "vitest"
import { z } from "zod"

import { codeErrorMap } from "./forms"

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
