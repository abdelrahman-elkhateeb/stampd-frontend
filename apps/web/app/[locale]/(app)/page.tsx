import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { getToday } from "@/features/attendance/attendance-data"
import {
  getAdminSummary,
  getManagerSummary,
  getUpcomingTimeOff,
} from "@/features/dashboard/dashboard-data"
import { DashboardPage } from "@/features/dashboard/dashboard-page"
import { getBalances } from "@/features/employees/employee-data"
import {
  getLeaveTypeNames,
  getMyRequests,
  getRequestTypes,
} from "@/features/requests/request-data"
import { getCompanySettings } from "@/features/settings/settings-data"
import type { Locale } from "@/i18n/routing"
import { getMe } from "@/lib/api"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav")
  return { title: t("dashboard") }
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  setRequestLocale((await params).locale as Locale)
  const me = await getMe()
  const [
    today,
    settings,
    balances,
    pending,
    upcoming,
    manager,
    admin,
    types,
    leaveTypes,
  ] = await Promise.all([
    getToday(),
    getCompanySettings(),
    getBalances(me.id),
    getMyRequests({ status: "pending,cancel-requested" }),
    getUpcomingTimeOff(),
    me.role === "employee" ? null : getManagerSummary(),
    me.role === "admin" ? getAdminSummary() : null,
    getRequestTypes(),
    getLeaveTypeNames(),
  ])
  return (
    <DashboardPage
      today={today}
      hours={settings}
      balances={balances.filter((balance) => balance.tracked)}
      pending={pending.slice(0, 5)}
      upcoming={upcoming}
      manager={manager}
      admin={admin}
      types={types}
      leaveTypes={leaveTypes}
    />
  )
}
