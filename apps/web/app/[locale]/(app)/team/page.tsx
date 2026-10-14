import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"
import { z } from "zod"

import {
  getDayDetail,
  getMonth,
  getToday,
} from "@/features/attendance/attendance-data"
import { TeamPage } from "@/features/team/team-page"
import type { Locale } from "@/i18n/routing"
import { getMe } from "@/lib/api"
import { isPlainDate } from "@/lib/format"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("team")
  return { title: t("title") }
}

const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/team">) {
  setRequestLocale((await params).locale as Locale)
  const query = await searchParams
  const [me, today] = await Promise.all([getMe(), getToday()])
  const asked = one(query.month)
  const month =
    asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked)
      ? asked
      : today.date.slice(0, 7)
  const employee = one(query.employee)
  const day = one(query.day)
  const [grid, detail] = await Promise.all([
    // Managers see self + team; the page is about the team.
    getMonth(month).then((rows) =>
      rows.filter((row) => row.employee.id !== me.id)
    ),
    employee && z.uuid().safeParse(employee).success && day && isPlainDate(day)
      ? getDayDetail(employee, day)
      : null,
  ])
  return (
    <Suspense>
      <TeamPage
        month={month}
        today={today.date}
        grid={grid}
        detail={detail}
        serverNow={today.serverNow}
      />
    </Suspense>
  )
}
