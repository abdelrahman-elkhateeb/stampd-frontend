import { getTranslations } from "next-intl/server"

import { getCompanySettings } from "@/features/settings/settings-data"
import { isMonth, isPlainDate, one } from "@/lib/format"
import { getMe } from "@/lib/api"

import { getDayDetail, getMonth, getToday } from "./attendance-data"
import { AttendanceHistory } from "./history"
import { addMonths } from "./rules"
import { TodayCard } from "./today-card"

/** How far back the month picker goes. */
const HISTORY_MONTHS = 12

/** Server component: reads today, the month on screen and the open day. */
export async function AttendancePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const t = await getTranslations("attendance")
  const [me, today, settings] = await Promise.all([
    getMe(),
    getToday(),
    getCompanySettings(),
  ])
  const thisMonth = today.date.slice(0, 7)
  const firstMonth = addMonths(thisMonth, -HISTORY_MONTHS)
  const asked = one(searchParams.month)
  const month =
    isMonth(asked) && asked >= firstMonth && asked < thisMonth
      ? asked
      : thisMonth
  const day = one(searchParams.day)
  const [[mine], [current], detail] = await Promise.all([
    getMonth(month),
    // The missed check-out warning looks at this month whatever month is on screen.
    month === thisMonth ? Promise.resolve([]) : getMonth(thisMonth),
    day && isPlainDate(day) && day <= today.date
      ? getDayDetail(me.id, day)
      : null,
  ])
  const days = mine?.days ?? []
  const lastWorked = (current?.days ?? days)
    .filter((item) => item.date < today.date && item.firstIn)
    .at(-1)
  const missed = lastWorked?.status === "missing" ? lastWorked.date : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <TodayCard today={today} hours={settings} missed={missed} />
        <AttendanceHistory
          month={month}
          thisMonth={thisMonth}
          firstMonth={firstMonth}
          today={today.date}
          days={days}
          detail={detail}
          serverNow={today.serverNow}
        />
      </div>
    </div>
  )
}
