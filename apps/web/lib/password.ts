import { z } from "zod"

// docs/design-system/components/password-field.md › Strength, Rules

export const MIN_PASSWORD_LENGTH = 10

// ponytail: a short list stands in for the server's breached/common check (BE-02).
const COMMON = [
  "password",
  "123456",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "abc123",
  "stampd",
]

export type PasswordRules = {
  length: boolean
  notCommon: boolean
  notPersonal: boolean
}

/** The server's rules, checked live. `personal` is the name and email the password must not contain. */
export function checkPasswordRules(
  password: string,
  personal: string[] = []
): PasswordRules {
  const lower = password.toLowerCase()
  const parts = personal
    .flatMap((value) => value.toLowerCase().split(/[\s@.]+/))
    .filter((part) => part.length >= 3)
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    notCommon: password !== "" && !COMMON.some((word) => lower.includes(word)),
    notPersonal: password !== "" && !parts.some((part) => lower.includes(part)),
  }
}

/**
 * 0–4 (Too weak … Strong). A hint only: the rules decide what the server accepts.
 * ponytail: length + character variety; swap for zxcvbn if users game it.
 */
export function passwordStrength(password: string, personal: string[] = []) {
  if (!password) return 0
  const rules = checkPasswordRules(password, personal)
  if (!rules.notCommon || !rules.notPersonal)
    return password.length >= 6 ? 1 : 0
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password)
  ).length
  let score = 0
  if (password.length >= 6) score++
  if (rules.length) score++
  if (password.length >= 14 || variety >= 3) score++
  if (password.length >= 14 && variety >= 3) score++
  return score
}

/** Rejects what the server will reject; the strength meter itself is only a hint. */
export const NewPassword = z.string().min(MIN_PASSWORD_LENGTH)

/** True when a long-enough password breaks the common or personal rule (a WEAK_PASSWORD error). */
export function passwordRulesIssue(password: string, personal: string[]) {
  const rules = checkPasswordRules(password, personal)
  return rules.length && !(rules.notCommon && rules.notPersonal)
}
