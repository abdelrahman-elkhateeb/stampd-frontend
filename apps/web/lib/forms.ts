import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import type { z } from "zod"

import type { ApiFieldError } from "@/lib/api-error"

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

/**
 * Puts an API problem on the form: each field error under its field (codes,
 * like Zod's), anything else as the form's root error. `fields` renames API
 * fields to form fields.
 */
export function showProblem<T extends FieldValues>(
  form: UseFormReturn<T>,
  problem: { code: string; fieldErrors: ApiFieldError[] },
  fields: Record<string, string> = {}
) {
  const values = form.getValues()
  const onForm = problem.fieldErrors.filter(
    ({ field }) => (fields[field] ?? field) in values
  )
  for (const { field, code } of onForm)
    form.setError((fields[field] ?? field) as Path<T>, { message: code })
  if (!onForm.length) form.setError("root", { message: problem.code })
}
