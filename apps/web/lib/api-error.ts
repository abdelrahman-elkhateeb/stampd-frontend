export type ApiFieldError = { field: string; code: string; message: string }

/** What a form shows when an action fails (see showProblem). */
export type Problem = { code: string; fieldErrors: ApiFieldError[] }

/** Every API error is `{ code, message, fieldErrors? }`; `message` is for logs only. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: ApiFieldError[]
  /** The request id (X-Request-Id); error pages show the digest as the support code. */
  readonly digest: string | undefined

  constructor(
    status: number,
    body: Partial<{
      code: string
      message: string
      fieldErrors: ApiFieldError[]
    }>,
    requestId?: string
  ) {
    super(body.message ?? `HTTP ${status}`)
    this.status = status
    this.code = body.code ?? "INTERNAL_ERROR"
    this.fieldErrors = body.fieldErrors ?? []
    this.digest = requestId
  }
}

/** Reads the error body; a proxy's HTML error page still gives a usable ApiError. */
export async function toApiError(response: Response) {
  const body = await response.json().catch(() => ({}))
  return new ApiError(
    response.status,
    body && typeof body === "object" ? body : {},
    response.headers.get("x-request-id") ?? undefined
  )
}
