import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { RequestsPage } from "@/features/requests/requests-list"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("requests")
  return { title: t("title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/requests">) {
  setRequestLocale((await params).locale as Locale)
  return (
    // Filters live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <RequestsPage />
    </Suspense>
  )
}
