import type { ErrorCode, FieldError } from "@/api/generated/model"
import { ErrorCode as ERROR_CODES } from "@/api/generated/model"

/** Codes the client can produce on its own, on top of the contract's ErrorCode. */
export type ClientErrorCode = "NETWORK_ERROR" | "UNKNOWN"
export type ApiErrorCode = ErrorCode | ClientErrorCode

export const REQUEST_ID_HEADER = "x-request-id"

export class ApiError extends Error {
  override readonly name = "ApiError"

  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    readonly fieldErrors: FieldError[] = [],
    readonly requestId?: string,
    message?: string
  ) {
    super(message ?? `${status} ${code}`)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError ||
    // Errors cross the server/client boundary as plain objects; check the shape too.
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: unknown }).name === "ApiError" &&
      typeof (error as { status?: unknown }).status === "number")
  )
}

const KNOWN_CODES = new Set<string>(Object.values(ERROR_CODES))

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED"
  if (status === 403) return "FORBIDDEN"
  if (status === 404) return "NOT_FOUND"
  if (status === 409) return "CONFLICT"
  if (status === 422) return "VALIDATION_FAILED"
  if (status === 429) return "TOO_MANY_ATTEMPTS"
  if (status >= 500) return "INTERNAL_ERROR"
  return "UNKNOWN"
}

/** Builds an ApiError from a non-2xx response, trusting only the contract's error shape. */
export async function apiErrorFromResponse(
  response: Response
): Promise<ApiError> {
  const requestId = response.headers.get(REQUEST_ID_HEADER) ?? undefined
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  const candidate = body as
    { code?: unknown; message?: unknown; fieldErrors?: unknown } | undefined
  const code =
    typeof candidate?.code === "string" && KNOWN_CODES.has(candidate.code)
      ? (candidate.code as ErrorCode)
      : codeForStatus(response.status)
  const fieldErrors = Array.isArray(candidate?.fieldErrors)
    ? (candidate.fieldErrors as FieldError[]).filter(
        (item) =>
          typeof item?.field === "string" && typeof item?.code === "string"
      )
    : []
  const message =
    typeof candidate?.message === "string" ? candidate.message : undefined

  return new ApiError(response.status, code, fieldErrors, requestId, message)
}

export function networkError(cause: unknown, requestId?: string): ApiError {
  const error = new ApiError(
    0,
    "NETWORK_ERROR",
    [],
    requestId,
    "Network request failed"
  )
  error.cause = cause
  return error
}

/** Only server faults and network failures are worth an alert; 4xx are expected outcomes. */
export function isReportable(error: ApiError) {
  return error.status === 0 || error.status >= 500
}
