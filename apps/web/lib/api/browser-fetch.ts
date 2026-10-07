import * as Sentry from "@sentry/nextjs"

import {
  apiErrorFromResponse,
  isReportable,
  networkError,
  REQUEST_ID_HEADER,
} from "./errors"
import { newRequestId } from "./request-id"

/**
 * Orval mutator for browser code. Calls go to our own /api/* route (the BFF),
 * which adds the session's access token; the browser never sees tokens.
 * Resolves with the response body; throws ApiError for anything else.
 */
export async function browserFetch<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const requestId = newRequestId()
  const headers = new Headers(init.headers)
  headers.set(REQUEST_ID_HEADER, requestId)

  let response: Response
  try {
    response = await fetch(`/api${url}`, {
      ...init,
      headers,
      credentials: "same-origin",
    })
  } catch (cause) {
    if (init.signal?.aborted) throw cause
    const error = networkError(cause, requestId)
    Sentry.captureException(error, { tags: { request_id: requestId } })
    throw error
  }

  if (!response.ok) {
    const error = await apiErrorFromResponse(response)
    if (isReportable(error)) {
      Sentry.captureException(error, {
        tags: { request_id: error.requestId ?? requestId },
      })
    }
    throw error
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
