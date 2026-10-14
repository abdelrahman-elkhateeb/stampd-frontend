import { api } from "@/lib/api"

import { reportQuery, VIEWS, type ViewId } from "./views"

export type ReportRow = Record<string, unknown>

export type Report = {
  from?: string
  to?: string
  year?: number
  timezone: string
  items: ReportRow[]
  totals?: Record<string, number>
  meta: { page: number; pageSize: number; totalItems: number }
}

/** One page of a report view; the CSV (every row) comes from the export route. */
export async function getReport(
  view: ViewId,
  query: Record<string, string | string[] | undefined>
) {
  const params = reportQuery(view, query)
  const page = Number(Array.isArray(query.page) ? query.page[0] : query.page)
  const size = Number(Array.isArray(query.size) ? query.size[0] : query.size)
  params.set("page", String(page > 0 ? page : 1))
  params.set("pageSize", String([10, 25, 50, 100].includes(size) ? size : 25))
  return api<Report>(`/reports/${VIEWS[view].path}?${params}`)
}
