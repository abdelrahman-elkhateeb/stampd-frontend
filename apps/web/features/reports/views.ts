import { one } from "@/lib/format"

/** The six report views (BE-14), by URL id. Plain module: the route and the page both read it. */
export const VIEWS = {
  attendanceSummary: { path: "attendance/summary", range: "dates" },
  attendanceDetail: { path: "attendance/detail", range: "dates" },
  leaveBalances: { path: "leave/balances", range: "year" },
  leaveRegister: { path: "leave/register", range: "dates" },
  wfhSummary: { path: "wfh/summary", range: "dates" },
  wfhRegister: { path: "wfh/register", range: "dates" },
} as const

export type ViewId = keyof typeof VIEWS

export const PRESETS = ["THIS_MONTH", "LAST_MONTH", "THIS_LEAVE_YEAR"] as const

export const isView = (value: unknown): value is ViewId =>
  typeof value === "string" && value in VIEWS

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The API query for a view from the page's URL: preset, or from + to, or year; and the page. */
export function reportQuery(
  view: ViewId,
  query: Record<string, string | string[] | undefined>
) {
  const get = (key: string) => one(query[key])
  const params = new URLSearchParams()
  if (VIEWS[view].range === "year") {
    const year = Number(get("year"))
    if (year >= 2000 && year <= 2100) params.set("year", String(year))
  } else {
    const from = get("from")
    const to = get("to")
    if (from && to && PLAIN_DATE.test(from) && PLAIN_DATE.test(to)) {
      params.set("from", from)
      params.set("to", to)
    } else {
      const preset = get("preset")
      params.set(
        "preset",
        (PRESETS as readonly string[]).includes(preset ?? "")
          ? preset!
          : "THIS_MONTH"
      )
    }
  }
  return params
}
