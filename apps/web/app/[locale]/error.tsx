"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { ErrorPage } from "@/components/error-page"
import { isApiError } from "@/lib/api/errors"

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const apiError = isApiError(error) ? error : null

  useEffect(() => {
    // API errors were already reported (with their request ID) by the fetcher.
    if (!apiError) Sentry.captureException(error)
  }, [error, apiError])

  // A client-side query that hit 403 throws here; show the same page as forbidden().
  if (apiError?.status === 403) {
    return <ErrorPage kind="forbidden" />
  }

  // The digest matches the server log entry, so support can find it.
  return (
    <ErrorPage
      kind="crash"
      code={apiError?.requestId ?? error.digest}
      onRetry={retry}
    />
  )
}
