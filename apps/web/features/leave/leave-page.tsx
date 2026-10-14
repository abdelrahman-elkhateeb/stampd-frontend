"use client"

import { PlusIcon, UmbrellaIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Status } from "@/components/status"
import type { Balance } from "@/features/employees/employee-data"
import type {
  LeaveTypeName,
  Request,
  RequestType,
} from "@/features/requests/request-data"
import { useRequestText } from "@/features/requests/request-text"
import { Link } from "@/i18n/navigation"
import { Button } from "@workspace/ui/components/button"
import { EmptyState } from "@workspace/ui/components/empty-state"

import { BalanceCard } from "./balance-card"

/** FE-07 My Leave: balances first, then every leave request. */
export function LeavePage({
  balances,
  requests,
  types,
  leaveTypes,
}: {
  balances: Balance[]
  requests: Request[]
  types: RequestType[]
  leaveTypes: LeaveTypeName[]
}) {
  const t = useTranslations("leave")
  const text = useRequestText({ types, leaveTypes })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {balances[0]
              ? t("description", { year: balances[0].year })
              : t("descriptionShort")}
          </p>
        </div>
        <Button asChild>
          <Link href="/leave/new">
            <PlusIcon aria-hidden />
            {t("request")}
          </Link>
        </Button>
      </div>

      <section aria-labelledby="balances-title" className="flex flex-col gap-3">
        <h2 id="balances-title" className="sr-only">
          {t("balancesTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {balances.map((balance) => (
            <BalanceCard key={balance.leaveType.id} balance={balance} />
          ))}
        </div>
      </section>

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="text-h3 font-bold">
          {t("historyTitle")}
        </h2>
        {requests.length ? (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/requests/${request.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="min-w-0 flex-1 font-semibold">
                    <bdi>{text.title(request)}</bdi>
                    <span className="block text-body-sm font-normal text-muted-foreground">
                      {text.when(request)}
                    </span>
                  </span>
                  <Status status={request.status} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={UmbrellaIcon}
            title={t("empty.title")}
            body={t("empty.body")}
          />
        )}
      </section>
    </div>
  )
}
