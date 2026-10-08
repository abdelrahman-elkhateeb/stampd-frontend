import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { AttendancePage } from "@/features/attendance/attendance-page"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("attendance")
  return { title: t("title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/attendance">) {
  setRequestLocale((await params).locale as Locale)
  return (
    // Month, view and open day live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <AttendancePage />
    </Suspense>
  )
}
