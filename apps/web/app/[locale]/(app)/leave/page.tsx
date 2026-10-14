import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { getBalances } from "@/features/employees/employee-data"
import { LeavePage } from "@/features/leave/leave-page"
import {
  getLeaveRequests,
  getLeaveTypeNames,
  getRequestTypes,
} from "@/features/requests/request-data"
import type { Locale } from "@/i18n/routing"
import { getMe } from "@/lib/api"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leave")
  return { title: t("title") }
}

export default async function Page({ params }: PageProps<"/[locale]/leave">) {
  setRequestLocale((await params).locale as Locale)
  const me = await getMe()
  const [balances, requests, types, leaveTypes] = await Promise.all([
    getBalances(me.id),
    getLeaveRequests(me.id),
    getRequestTypes(),
    getLeaveTypeNames(),
  ])
  return (
    <LeavePage
      balances={balances}
      requests={requests}
      types={types}
      leaveTypes={leaveTypes}
    />
  )
}
