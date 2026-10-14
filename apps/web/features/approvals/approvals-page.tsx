"use client"

import { InboxIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Status } from "@/components/status"
import { RequestDetail } from "@/features/requests/request-detail"
import type {
  LeaveTypeName,
  Request,
  RequestDetail as Detail,
  RequestType,
} from "@/features/requests/request-data"
import { categoryOf, useRequestText } from "@/features/requests/request-text"
import { Link } from "@/i18n/navigation"
import { PersonAvatar } from "@workspace/ui/components/avatar"
import { CategoryIcon } from "@workspace/ui/components/category-chip"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { cn } from "@workspace/ui/lib/utils"

type Tab = "pending" | "decided"

/**
 * FE-10 approvals: the inbox beside the review panel (review-panel.md). The URL holds the
 * tab and the open request (?tab=decided&request=…); deciding re-renders both from the server.
 * ponytail: no balance-after or teammates-out in the panel (managers can't preview others' leave).
 */
export function ApprovalsPage({
  tab,
  requests,
  open,
  types,
  leaveTypes,
}: {
  tab: Tab
  requests: Request[]
  open: Detail | null
  types: RequestType[]
  leaveTypes: LeaveTypeName[]
}) {
  const t = useTranslations("approvals")
  const text = useRequestText({ types, leaveTypes })
  const href = (next: { tab?: Tab; request?: string }) => {
    const params = new URLSearchParams()
    if ((next.tab ?? tab) === "decided") params.set("tab", "decided")
    if (next.request) params.set("request", next.request)
    const query = params.toString()
    return query ? `/approvals?${query}` : "/approvals"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("flex flex-col gap-1", open && "max-lg:hidden")}>
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <nav
          aria-label={t("listLabel")}
          className={cn("flex flex-col gap-3", open && "max-lg:hidden")}
        >
          <div role="tablist" className="flex gap-1 border-b">
            {(["pending", "decided"] as const).map((id) => (
              <Link
                key={id}
                role="tab"
                aria-selected={tab === id}
                href={href({ tab: id })}
                className={cn(
                  "-mb-px border-b-2 border-transparent px-3 py-2 text-body-sm font-semibold text-muted-foreground",
                  tab === id && "border-foreground text-foreground"
                )}
              >
                {t(`tabs.${id}`)}
              </Link>
            ))}
          </div>
          {requests.length ? (
            <>
              <p className="text-body-sm text-muted-foreground">
                {t(tab === "pending" ? "pendingCount" : "decidedCount", {
                  count: requests.length,
                })}
              </p>
              <ul className="flex flex-col divide-y rounded-lg border bg-card">
                {requests.map((request) => {
                  const selected = open?.id === request.id
                  return (
                    <li key={request.id}>
                      <Link
                        href={href({ request: request.id })}
                        aria-current={selected ? "true" : undefined}
                        className={cn(
                          "flex items-center gap-3 border-s-[3px] border-transparent px-3 py-3 outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                          selected && "border-foreground bg-brand-subtle"
                        )}
                      >
                        <PersonAvatar
                          name={request.requester.name ?? ""}
                          userId={request.requester.id}
                          size={32}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-semibold">
                            <bdi>{request.requester.name}</bdi>
                          </span>
                          <span className="flex items-center gap-1.5 truncate text-body-sm text-muted-foreground">
                            <CategoryIcon
                              category={categoryOf(request.type)}
                              className="size-3.5 shrink-0"
                            />
                            <bdi className="truncate">
                              {text.typeLabel(request.type)} ·{" "}
                              {text.days(request)}
                            </bdi>
                          </span>
                        </span>
                        <Status status={request.status} size="sm" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <EmptyState
              icon={InboxIcon}
              title={t(tab === "pending" ? "caughtUp.title" : "noDecided")}
              body={tab === "pending" ? t("caughtUp.body") : undefined}
            />
          )}
        </nav>
        <section aria-label={t("panelLabel")} className="min-w-0">
          {open ? (
            <RequestDetail
              key={open.id}
              request={open}
              types={types}
              leaveTypes={leaveTypes}
              back={{ href: href({}), label: t("title") }}
            />
          ) : requests.length ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground max-lg:hidden">
              {t("pick")}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
