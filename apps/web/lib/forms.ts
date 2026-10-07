import type { FieldErrorCode } from "@/api/generated/model"
import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import type { z } from "zod"

import { isApiError, type ApiErrorCode } from "@/lib/api/errors"

/**
 * Validation messages travel as codes, never as text: Zod issues and API field errors
 * both become a FieldErrorCode, and the UI translates it (messages › fieldErrors).
 */
export function issueToFieldCode(issue: z.core.$ZodRawIssue): FieldErrorCode {
  // An empty field is "required", whatever rule it failed (e.g. an empty email fails the format).
  if (issue.input === "" || issue.input === undefined) {
    return "REQUIRED"
  }
  switch (issue.code) {
    case "too_small":
      return issue.minimum === 1 && issue.origin === "string"
        ? "REQUIRED"
        : "TOO_SHORT"
    case "too_big":
      return "TOO_LONG"
    case "invalid_type":
      return issue.input === undefined || issue.input === ""
        ? "REQUIRED"
        : "INVALID_FORMAT"
    default:
      return "INVALID_FORMAT"
  }
}

/** Pass to zodResolver / schema.parse so issue messages are codes. */
export const codeErrorMap = { error: issueToFieldCode }

export type FormErrors<T extends FieldValues = FieldValues> = {
  /** Per-field codes, keyed by the form field name. */
  fieldErrors?: Partial<Record<Path<T>, FieldErrorCode>>
  /** A form-level error code (shown above the submit button or as a toast). */
  formError?: ApiErrorCode
}

/** Turns a failed Zod parse into FormErrors (used by Server Actions). */
export function zodToFormErrors<T extends FieldValues>(
  error: z.ZodError
): FormErrors<T> {
  const fieldErrors: Partial<Record<string, FieldErrorCode>> = {}
  for (const issue of error.issues) {
    const field = issue.path.join(".")
    fieldErrors[field] ??= issue.message as FieldErrorCode
  }
  return { fieldErrors: fieldErrors as FormErrors<T>["fieldErrors"] }
}

/** Turns an API error into FormErrors: field errors go to fields, the rest to the form. */
export function apiToFormErrors<T extends FieldValues>(
  error: unknown
): FormErrors<T> {
  if (!isApiError(error)) {
    return { formError: "UNKNOWN" }
  }
  if (error.fieldErrors.length === 0) {
    return { formError: error.code }
  }
  const fieldErrors: Partial<Record<string, FieldErrorCode>> = {}
  for (const item of error.fieldErrors) {
    fieldErrors[item.field] ??= item.code
  }
  return { fieldErrors: fieldErrors as FormErrors<T>["fieldErrors"] }
}

/** Puts FormErrors onto a react-hook-form instance; the field components translate the codes. */
export function applyFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: FormErrors<T>
) {
  let focused = false
  for (const [field, code] of Object.entries(errors.fieldErrors ?? {})) {
    setError(
      field as Path<T>,
      { type: "server", message: code as string },
      { shouldFocus: !focused }
    )
    focused = true
  }
  if (errors.formError) {
    setError("root.server" as Path<T>, {
      type: "server",
      message: errors.formError,
    })
  }
}
