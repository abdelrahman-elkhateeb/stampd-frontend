import { describe, expect, it } from "vitest"

import { checkPasswordRules, passwordStrength } from "./password"

describe("password rules", () => {
  it("checks length, common words and personal details", () => {
    expect(checkPasswordRules("short")).toMatchObject({ length: false })
    expect(checkPasswordRules("Password2026!")).toMatchObject({
      length: true,
      notCommon: false,
    })
    expect(
      checkPasswordRules("sara-harbi-2026", ["Sara Al-Harbi", "sara@x.com"])
    ).toMatchObject({ notPersonal: false })
    expect(checkPasswordRules("")).toEqual({
      length: false,
      notCommon: false,
      notPersonal: false,
    })
  })
})

describe("password strength", () => {
  it("rises with length and variety, and caps common passwords", () => {
    expect(passwordStrength("")).toBe(0)
    expect(passwordStrength("abcdefg")).toBe(1)
    expect(passwordStrength("abcdefghij")).toBe(2)
    expect(passwordStrength("Abcdefghi9")).toBe(3)
    expect(passwordStrength("Blue-Camel-Rides-42")).toBe(4)
    expect(passwordStrength("Password2026!longer")).toBe(1)
  })
})
