import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { getToday } from "@/features/attendance/attendance-data"
import { getCalendar } from "@/features/calendar/calendar-data"
import { CalendarPage } from "@/features/calendar/calendar-page"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("calendar")
  return { title: t("title") }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/calendar">) {
  setRequestLocale((await params).locale as Locale)
  const query = await searchParams
  const { date: today } = await getToday()
  const thisMonth = today.slice(0, 7)
  const month =
    typeof query.month === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month)
      ? query.month
      : thisMonth
  const { events, days } = await getCalendar(month, {
    pending: query.pending === "true",
    team: query.team === "true",
  })
  return (
    // Month, view and filters live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <CalendarPage
        month={month}
        thisMonth={thisMonth}
        today={today}
        events={events}
        days={days}
      />
    </Suspense>
  )
}
