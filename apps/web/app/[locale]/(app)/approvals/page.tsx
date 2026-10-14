import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ApprovalsPage } from "@/features/approvals/approvals-page"
import {
  getApprovals,
  getLeaveTypeNames,
  getRequest,
  getRequestTypes,
} from "@/features/requests/request-data"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("approvals")
  return { title: t("title") }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/approvals">) {
  setRequestLocale((await params).locale as Locale)
  const query = await searchParams
  const tab = query.tab === "decided" ? "decided" : "pending"
  const id = typeof query.request === "string" ? query.request : null
  const [requests, open, types, leaveTypes] = await Promise.all([
    getApprovals(tab),
    id ? getRequest(id) : null,
    getRequestTypes(),
    getLeaveTypeNames(),
  ])
  return (
    <ApprovalsPage
      tab={tab}
      requests={requests}
      open={open}
      types={types}
      leaveTypes={leaveTypes}
    />
  )
}
