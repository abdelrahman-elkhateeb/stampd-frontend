import { getTranslations } from "next-intl/server"

import { Skeleton, TableSkeleton } from "@workspace/ui/components/skeleton"

// Every (app) page reads the API per request; this shows instantly (and lets links prefetch) while it does.
export default async function Loading() {
  const t = await getTranslations("common")
  return (
    <div className="skeleton-delay flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-lg border">
        <TableSkeleton rows={6} columns={4} label={t("loading")} />
      </div>
    </div>
  )
}
