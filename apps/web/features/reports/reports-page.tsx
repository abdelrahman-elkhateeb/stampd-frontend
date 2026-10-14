"use client"

import { DownloadIcon, FileBarChartIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"

import { DateRangeField } from "@/components/pickers"
import { Status } from "@/components/status"
import { toAttendanceStatus } from "@/features/attendance/rules"
import { useRequestTypeLabel } from "@/features/requests/request-text"
import { useFormat } from "@/lib/use-format"
import { useTableLabels } from "@/lib/use-table-labels"
import { Button } from "@workspace/ui/components/button"
import type { RequestStatus } from "@workspace/ui/components/status-chip"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { TablePagination } from "@workspace/ui/components/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import type { Report, ReportRow } from "./report-data"
import { PRESETS, VIEWS, type ViewId } from "./views"

type Kind =
  | "text"
  | "number"
  | "date"
  | "time"
  | "attendance"
  | "request"
  | "type"
  | "yesNo"
type Column = { key: string; kind: Kind }

const PERSON: Column[] = [
  { key: "employee.name", kind: "text" },
  { key: "department.name", kind: "text" },
]
const REGISTER: Column[] = [
  { key: "startDate", kind: "date" },
  { key: "endDate", kind: "date" },
  { key: "days", kind: "number" },
  { key: "daysInRange", kind: "number" },
  { key: "status", kind: "request" },
  { key: "approver.name", kind: "text" },
]
const num = (...keys: string[]): Column[] =>
  keys.map((key) => ({ key, kind: "number" }))

const COLUMNS: Record<ViewId, Column[]> = {
  attendanceSummary: [
    ...PERSON,
    ...num(
      "workingDays",
      "present",
      "late",
      "absent",
      "wfh",
      "onLeave",
      "unpaidLeaveDays",
      "businessTrip",
      "missingCheckouts",
      "workedHours",
      "corrections"
    ),
  ],
  attendanceDetail: [
    { key: "employee.name", kind: "text" },
    { key: "date", kind: "date" },
    { key: "status", kind: "attendance" },
    { key: "firstCheckInAt", kind: "time" },
    { key: "lastCheckOutAt", kind: "time" },
    { key: "workedHours", kind: "number" },
    { key: "corrected", kind: "yesNo" },
  ],
  leaveBalances: [
    ...PERSON,
    { key: "leaveType.name", kind: "text" },
    ...num(
      "entitlement",
      "adjustments",
      "used",
      "upcoming",
      "pending",
      "available"
    ),
  ],
  leaveRegister: [
    ...PERSON,
    { key: "leaveType.name", kind: "text" },
    ...REGISTER,
  ],
  wfhSummary: [...PERSON, ...num("wfhDays", "approved", "rejected", "pending")],
  wfhRegister: [...PERSON, { key: "type", kind: "type" }, ...REGISTER],
}

const get = (row: ReportRow, path: string) =>
  path
    .split(".")
    .reduce<unknown>(
      (value, key) => (value as Record<string, unknown> | null)?.[key],
      row
    )

const IDS = Object.keys(VIEWS) as ViewId[]

/** FE-14 reports: one view at a time, a page on screen and the full CSV from the same query. */
export function ReportsPage({
  view,
  report,
  query,
}: {
  view: ViewId
  report: Report
  /** The URL's report query (for the export link). */
  query: string
}) {
  const t = useTranslations("reports")
  const tAll = useTranslations()
  const locale = useLocale()
  const format = useFormat()
  const labels = useTableLabels()
  const typeLabel = useRequestTypeLabel()
  const [state, setState] = useQueryStates(
    {
      view: parseAsStringLiteral(IDS).withDefault("attendanceSummary"),
      preset: parseAsStringLiteral(PRESETS),
      from: parseAsString,
      to: parseAsString,
      year: parseAsInteger,
      page: parseAsInteger.withDefault(1),
      size: parseAsInteger.withDefault(25),
    },
    { history: "replace", clearOnDefault: true, shallow: false }
  )
  const columns = COLUMNS[view]
  const byYear = VIEWS[view].range === "year"
  const thisYear = report.year ?? new Date().getFullYear()

  function cell(row: ReportRow, column: Column) {
    const value = get(row, column.key)
    if (value === null || value === undefined || value === "") return "–"
    switch (column.kind) {
      case "number":
        return format.number(value as number)
      case "date":
        return format.day(value as PlainDate, "numeric")
      case "time":
        return <bdi dir="ltr">{format.time(value as string)}</bdi>
      case "yesNo":
        return tAll(value ? "common.yes" : "common.no")
      case "type":
        return typeLabel(value as string)
      case "attendance": {
        const status = toAttendanceStatus(value as never)
        return status ? <Status status={status} size="sm" /> : "–"
      }
      case "request":
        return (
          <Status
            status={
              (value === "CANCELLATION_REQUESTED"
                ? "cancel-requested"
                : String(value).toLowerCase()) as RequestStatus
            }
            size="sm"
          />
        )
      default:
        return <bdi>{String(value)}</bdi>
    }
  }

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Tabs
        value={view}
        onValueChange={(id) =>
          setState({ view: id as ViewId, page: null, year: null })
        }
      >
        <TabsList>
          {IDS.map((id) => (
            <TabsTrigger key={id} value={id}>
              {t(`views.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-end gap-3">
        {byYear ? (
          <Select
            value={String(thisYear)}
            onValueChange={(year) =>
              setState({ year: Number(year), page: null })
            }
          >
            <SelectTrigger aria-label={t("year")} className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[thisYear - 1, thisYear, thisYear + 1].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <>
            <Select
              value={state.from ? "CUSTOM" : (state.preset ?? "THIS_MONTH")}
              onValueChange={(preset) =>
                preset !== "CUSTOM" &&
                setState({
                  preset: preset === "THIS_MONTH" ? null : (preset as never),
                  from: null,
                  to: null,
                  page: null,
                })
              }
            >
              <SelectTrigger aria-label={t("range")} className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {t(`presets.${preset}`)}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM">{t("presets.CUSTOM")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-72">
              <DateRangeField
                label={t("dates")}
                value={{
                  from: (report.from ?? null) as PlainDate | null,
                  to: (report.to ?? null) as PlainDate | null,
                }}
                onChange={(range) =>
                  range.from &&
                  range.to &&
                  setState({
                    from: range.from,
                    to: range.to,
                    preset: null,
                    page: null,
                  })
                }
              />
            </div>
          </>
        )}
        <Button variant="secondary" size="sm" className="ms-auto" asChild>
          <a href={`/${locale}/reports/export?view=${view}&${query}`} download>
            <DownloadIcon aria-hidden />
            {t("export")}
          </a>
        </Button>
      </div>
      <p className="-mt-3 text-body-sm text-muted-foreground">
        {t("timezone", { zone: report.timezone })}
      </p>

      {report.items.length ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableCaption className="sr-only">
              {t(`views.${view}`)}
            </TableCaption>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "whitespace-nowrap",
                      column.kind === "number" && "text-end"
                    )}
                  >
                    {t(`columns.${column.key.replace(".", "_")}` as never)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.items.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap",
                        column.kind === "number" && "tabular text-end"
                      )}
                    >
                      {cell(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            {report.totals ? (
              <tfoot>
                <TableRow className="border-t-[1.5px] border-border-strong font-extrabold">
                  {columns.map((column, index) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.kind === "number" && "tabular text-end"
                      )}
                    >
                      {index === 0
                        ? t("totals")
                        : column.kind === "number" &&
                            report.totals?.[column.key] !== undefined
                          ? format.number(report.totals[column.key]!)
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              </tfoot>
            ) : null}
          </Table>
          <TablePagination
            page={report.meta.page}
            pageSize={report.meta.pageSize as never}
            total={report.meta.totalItems}
            onPageChange={(page) => setState({ page })}
            onPageSizeChange={(size) => setState({ size, page: null })}
            labels={labels.pagination}
            formatNumber={labels.formatNumber}
          />
        </div>
      ) : (
        <EmptyState
          icon={FileBarChartIcon}
          title={t("empty.title")}
          body={t("empty.body")}
        />
      )}
    </div>
  )
}
