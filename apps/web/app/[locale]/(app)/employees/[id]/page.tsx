import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { EmployeeDetail } from "@/features/employees/employee-detail"
import {
  getBalances,
  getDepartments,
  getEmployee,
  getEmployeeHistory,
  getLedger,
  getManagerOptions,
} from "@/features/employees/employee-data"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("employees")
  return { title: t("detail.title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/employees/[id]">) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)
  const employee = await getEmployee(id)
  const [balances, history, departments, managers] = await Promise.all([
    getBalances(id),
    getEmployeeHistory(id),
    getDepartments(),
    getManagerOptions(),
  ])
  const tracked = balances.filter((balance) => balance.tracked)
  const ledgers = Object.fromEntries(
    await Promise.all(
      tracked.map(
        async (balance) =>
          [
            balance.leaveType.id,
            await getLedger(id, balance.leaveType.id),
          ] as const
      )
    )
  )
  return (
    <EmployeeDetail
      employee={employee}
      balances={balances}
      ledgers={ledgers}
      history={history}
      departments={departments}
      managers={managers}
    />
  )
}
