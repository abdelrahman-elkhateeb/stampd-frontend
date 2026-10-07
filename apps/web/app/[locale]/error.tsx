"use client"

import { ErrorPage } from "@/components/error-page"

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  // The digest matches the server log entry, so support can find it.
  return <ErrorPage kind="crash" code={error.digest} onRetry={retry} />
}
