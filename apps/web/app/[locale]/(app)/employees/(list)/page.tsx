import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import {
  getDepartments,
  getEmployees,
  getManagerOptions,
} from "@/features/employees/employee-data"
import { EmployeesList } from "@/features/employees/employees-list"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("employees")
  return { title: t("title") }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/employees">) {
  setRequestLocale((await params).locale as Locale)
  const [{ rows, total }, departments, managers] = await Promise.all([
    getEmployees(await searchParams),
    getDepartments(),
    getManagerOptions(),
  ])
  return (
    // Filters, sort and page live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <EmployeesList
        rows={rows}
        total={total}
        departments={departments}
        managers={managers}
      />
    </Suspense>
  )
}
