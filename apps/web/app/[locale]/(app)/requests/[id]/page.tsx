import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import {
  getLeaveTypeNames,
  getRequest,
  getRequestTypes,
} from "@/features/requests/request-data"
import { RequestDetail } from "@/features/requests/request-detail"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("requests")
  return { title: t("detail.title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/requests/[id]">) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)
  const [request, types, leaveTypes] = await Promise.all([
    getRequest(id),
    getRequestTypes(),
    getLeaveTypeNames(),
  ])
  return (
    <RequestDetail request={request} types={types} leaveTypes={leaveTypes} />
  )
}
