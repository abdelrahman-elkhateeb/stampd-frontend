import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { z } from "zod"

import {
  getDayDetail,
  getDays,
  getExceptions,
  getMonth,
  getToday,
} from "@/features/attendance/attendance-data"
import { ReviewPage } from "@/features/attendance-review/review-page"
import { TABS, type Tab } from "@/features/attendance-review/tabs"
import { getApprovals } from "@/features/requests/request-data"
import type { Locale } from "@/i18n/routing"
import { isMonth, isPlainDate, one } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("attendanceReview")
  return { title: t("title") }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/attendance-review">) {
  setRequestLocale((await params).locale as Locale)
  const query = await searchParams
  const today = await getToday()
  const tab = (TABS as readonly string[]).includes(one(query.tab) ?? "")
    ? (one(query.tab) as Tab)
    : "day"
  const askedDate = one(query.date)
  const date =
    askedDate && isPlainDate(askedDate) && askedDate <= today.date
      ? askedDate
      : today.date
  const askedMonth = one(query.month)
  const month = isMonth(askedMonth) ? askedMonth : today.date.slice(0, 7)
  const employee = one(query.employee)
  const day = one(query.day)
  const [grid, exceptions, pending, detail] = await Promise.all([
    tab === "day" ? getDays(date) : tab === "month" ? getMonth(month) : [],
    tab === "exceptions"
      ? getExceptions(`${today.date.slice(0, 7)}-01` as typeof date, today.date)
      : [],
    getApprovals("pending"),
    employee && z.uuid().safeParse(employee).success && day && isPlainDate(day)
      ? getDayDetail(employee, day)
      : null,
  ])
  return (
    // The tab, dates and open day live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <ReviewPage
        tab={tab}
        today={today.date}
        date={date}
        month={month}
        grid={grid}
        exceptions={exceptions}
        corrections={pending.filter(
          (request) => request.type === "ATTENDANCE_CORRECTION"
        )}
        detail={detail}
        serverNow={today.serverNow}
      />
    </Suspense>
  )
}
