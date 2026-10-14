"use client"

import { UsersIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { parseAsString, useQueryStates } from "nuqs"

import type {
  DayDetail,
  EmployeeDays,
} from "@/features/attendance/attendance-data"
import { DayDrawer } from "@/features/attendance/history"
import { MonthMatrix } from "@/features/attendance-review/review-page"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import { EmptyState } from "@workspace/ui/components/empty-state"

/** FE-10 My team: the direct reports' month, read-only (managers don't correct attendance). */
export function TeamPage({
  month,
  today,
  grid,
  detail,
  serverNow,
}: {
  month: string
  today: PlainDate
  grid: EmployeeDays[]
  detail: DayDetail | null
  serverNow: number
}) {
  const t = useTranslations("team")
  const [, setQuery] = useQueryStates(
    { month: parseAsString, employee: parseAsString, day: parseAsString },
    { history: "replace", clearOnDefault: true, shallow: false }
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      {grid.length ? (
        <MonthMatrix
          month={month}
          today={today}
          grid={grid}
          onOpen={(employee, day) => setQuery({ employee, day })}
          onMonth={(next) => setQuery({ month: next })}
        />
      ) : (
        <EmptyState
          icon={UsersIcon}
          title={t("empty.title")}
          body={t("empty.body")}
        />
      )}
      <DayDrawer
        detail={detail}
        today={today}
        serverNow={serverNow}
        onClose={() => setQuery({ employee: null, day: null })}
      />
    </div>
  )
}
