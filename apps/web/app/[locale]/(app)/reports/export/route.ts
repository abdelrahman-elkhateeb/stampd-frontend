import { cookies } from "next/headers"

import { reportQuery, VIEWS, isView } from "@/features/reports/views"
import { apiUrl } from "@/lib/api"
import { ACCESS_COOKIE } from "@/lib/session"

/**
 * GET /reports/export?view=…&preset=… → the API's CSV, streamed with its file name. The browser
 * never holds the token, so the download goes through the Next server (proxy.ts refreshed it).
 */
export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams)
  const view = query.view
  if (!isView(view)) return new Response(null, { status: 404 })
  const params = reportQuery(view, query)
  params.set("format", "csv")
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  const response = await fetch(
    apiUrl(`/reports/${VIEWS[view].path}?${params}`),
    {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  ).catch(() => new Response(null, { status: 503 }))
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        response.headers.get("content-disposition") ?? "attachment",
    },
  })
}
