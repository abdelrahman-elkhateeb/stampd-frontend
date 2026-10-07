import type { z } from "zod"

export type FieldErrorCode =
  "REQUIRED" | "INVALID_FORMAT" | "TOO_SHORT" | "TOO_LONG"

/**
 * Validation messages travel as codes, never as text: Zod issues become a
 * FieldErrorCode, and the UI translates it (messages › fieldErrors).
 */
export function issueToFieldCode(issue: z.core.$ZodRawIssue): FieldErrorCode {
  // An empty field is "required", whatever rule it failed (e.g. an empty email fails the format).
  if (issue.input === "" || issue.input === undefined) return "REQUIRED"
  if (issue.code === "too_small") return "TOO_SHORT"
  if (issue.code === "too_big") return "TOO_LONG"
  return "INVALID_FORMAT"
}

/** Pass to zodResolver / schema.parse so issue messages are codes. */
export const codeErrorMap = { error: issueToFieldCode }
