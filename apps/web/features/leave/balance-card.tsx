"use client"

import { useTranslations } from "next-intl"

import type { Balance } from "@/features/employees/employee-data"
import { useFormat } from "@/lib/use-format"
import { Card } from "@workspace/ui/components/card"
import { LeaveIcon } from "@workspace/ui/components/icon-picker"
import { cn } from "@workspace/ui/lib/utils"

// Fixed order and patterns (balance-card.md); written out so Tailwind sees them.
const SEGMENTS = [
  { key: "used", className: "bg-foreground" },
  {
    key: "upcoming",
    className:
      "bg-cat-leave bg-[repeating-linear-gradient(45deg,var(--foreground)_0_2px,transparent_2px_6px)]",
  },
  {
    key: "pending",
    className:
      "bg-status-pending-bg bg-[repeating-linear-gradient(90deg,var(--status-pending)_0_2px,transparent_2px_5px)]",
  },
  { key: "available", className: "bg-cat-leave" },
] as const

/** docs/design-system/components/balance-card.md · the numbers come from the API. */
export function BalanceCard({
  balance,
  variant = "full",
}: {
  balance: Balance
  variant?: "full" | "tile"
}) {
  const t = useTranslations("leave.balance")
  const format = useFormat()
  const days = (value: number) => format.number(value)
  const total = balance.entitlement + balance.adjustments
  const values = {
    used: balance.used,
    upcoming: balance.upcoming,
    pending: balance.pending,
    available: Math.max(balance.available, 0),
  }
  const over = balance.available < 0

  return (
    <Card className="gap-3" aria-label={balance.leaveType.name}>
      <div className="flex items-center gap-3">
        <LeaveIcon
          icon={balance.leaveType.icon}
          className="size-10 [&_svg]:size-5"
        />
        <p className="min-w-0 flex-1 truncate text-body font-bold">
          <bdi>{balance.leaveType.name}</bdi>
        </p>
      </div>
      {balance.tracked ? (
        <>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={cn(
                "tabular text-numeric font-extrabold",
                over && "text-error"
              )}
            >
              <bdi dir="ltr">
                {over
                  ? `−${days(-balance.available)}`
                  : days(balance.available)}
              </bdi>
            </span>
            <span className="text-body-sm text-muted-foreground">
              {over
                ? t("over", { count: -balance.available })
                : t("of", { total: days(total) })}
            </span>
          </p>
          {variant === "full" ? (
            <>
              <div
                role="img"
                aria-label={t("bar", {
                  total: days(total),
                  used: days(values.used),
                  upcoming: days(values.upcoming),
                  pending: days(values.pending),
                  available: days(values.available),
                })}
                className="flex h-3.5 overflow-hidden rounded-pill bg-muted shadow-[inset_0_0_0_1px_var(--border-strong)]"
              >
                {total > 0
                  ? SEGMENTS.map((segment) =>
                      values[segment.key] > 0 ? (
                        <span
                          key={segment.key}
                          className={segment.className}
                          style={{
                            width: `${Math.min(100, (values[segment.key] / total) * 100)}%`,
                          }}
                        />
                      ) : null
                    )
                  : null}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-sm">
                {SEGMENTS.map((segment) => (
                  <div key={segment.key} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "size-3 shrink-0 rounded-xs border border-border-strong",
                        segment.className
                      )}
                    />
                    <dt className="text-muted-foreground">{t(segment.key)}</dt>
                    <dd className="tabular ms-auto font-semibold">
                      {days(values[segment.key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : balance.pending > 0 ? (
            <p className="text-body-sm text-status-pending">
              {t("pendingCount", { count: balance.pending })}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-body-sm text-muted-foreground">
          {t("untracked", { count: balance.used + balance.upcoming })}
        </p>
      )}
    </Card>
  )
}
