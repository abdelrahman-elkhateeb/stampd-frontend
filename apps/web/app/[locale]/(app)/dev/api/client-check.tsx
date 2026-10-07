"use client"

import { useGetCurrentUser } from "@/api/generated/query/me/me"
import { RelativeTime } from "@/components/relative-time"
import { Button } from "@workspace/ui/components/button"

/** The same data through the browser path: TanStack Query → /api/me (BFF) → backend. */
export function ClientCheck() {
  const { data, error, isFetching, refetch, dataUpdatedAt } =
    useGetCurrentUser()

  return (
    <section className="flex flex-col gap-2" aria-labelledby="client-user">
      <h2 id="client-user" className="text-h4 font-semibold">
        Current user (browser, via /api)
      </h2>
      {error ? (
        <p role="alert" className="text-error">
          {error.code}
        </p>
      ) : (
        <p data-testid="client-user-name" className="text-body-sm">
          {data ? <bdi>{data.name}</bdi> : "Loading…"}
        </p>
      )}
      {dataUpdatedAt ? (
        <p className="text-caption text-muted-foreground">
          Fetched <RelativeTime iso={new Date(dataUpdatedAt).toISOString()} />
        </p>
      ) : null}
      <div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Refetch
        </Button>
      </div>
    </section>
  )
}
