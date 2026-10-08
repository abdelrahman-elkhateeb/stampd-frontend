import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { EmployeesList } from "@/features/employees/employees-list"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("employees")
  return { title: t("title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/employees">) {
  setRequestLocale((await params).locale as Locale)
  return (
    // Filters, sort and page live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <EmployeesList />
    </Suspense>
  )
}
