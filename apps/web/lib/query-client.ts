import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"

import { isApiError, type ApiErrorCode } from "@/lib/api/errors"

const MAX_RETRIES = 2

export type ApiErrorHandlers = {
  /** Session is over (refresh failed): send the user to login, then back here. */
  onUnauthenticated: () => void
  /** A mutation failed and its caller didn't handle it: show a toast. */
  onMutationError: (code: ApiErrorCode) => void
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Set when the caller shows the error itself (e.g. under form fields). */
      handlesErrors?: boolean
    }
  }
}

// Set by <Providers> once it has a router and translations; read when an error happens.
let handlers: ApiErrorHandlers = {
  onUnauthenticated: () => {},
  onMutationError: () => {},
}

export function setApiErrorHandlers(next: ApiErrorHandlers) {
  handlers = next
}

function isClientError(error: unknown) {
  return isApiError(error) && error.status >= 400 && error.status < 500
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isApiError(error) && error.status === 401)
          handlers.onUnauthenticated()
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (isApiError(error) && error.status === 401) {
          handlers.onUnauthenticated()
          return
        }
        if (mutation.meta?.handlesErrors) return
        // Field errors belong under fields; anything else is a global error → toast.
        handlers.onMutationError(isApiError(error) ? error.code : "UNKNOWN")
      },
    }),
    defaultOptions: {
      queries: {
        // Above zero so data prefetched on the server isn't refetched immediately on hydration.
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        // 4xx won't fix itself on retry; 5xx and network errors get two more tries.
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < MAX_RETRIES,
      },
      mutations: { retry: false },
    },
  })
}
