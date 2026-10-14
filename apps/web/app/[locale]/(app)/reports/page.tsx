import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { getReport } from "@/features/reports/report-data"
import { ReportsPage } from "@/features/reports/reports-page"
import { isView, reportQuery } from "@/features/reports/views"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reports")
  return { title: t("title") }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/reports">) {
  setRequestLocale((await params).locale as Locale)
  const query = await searchParams
  const view = isView(query.view) ? query.view : "attendanceSummary"
  return (
    // The view, range and page live in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <ReportsPage
        view={view}
        report={await getReport(view, query)}
        query={reportQuery(view, query).toString()}
      />
    </Suspense>
  )
}
