import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { NewRequestPage } from "@/features/requests/new-request"
import {
  getActiveEmployees,
  getRequestTypes,
} from "@/features/requests/request-data"
import type { Locale } from "@/i18n/routing"
import { getMe } from "@/lib/api"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("requests")
  return { title: t("new") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/requests/new">) {
  setRequestLocale((await params).locale as Locale)
  const me = await getMe()
  const [types, employees] = await Promise.all([
    getRequestTypes(),
    me.role === "admin" ? getActiveEmployees() : undefined,
  ])
  return (
    // The type and prefilled values come from the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <NewRequestPage types={types} employees={employees} />
    </Suspense>
  )
}
