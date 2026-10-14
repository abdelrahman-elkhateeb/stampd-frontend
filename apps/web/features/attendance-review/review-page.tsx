"use client"

import { CalendarCheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"

import { DateField } from "@/components/pickers"
import { Status, StatusFlag } from "@/components/status"
import { useUser } from "@/components/user-provider"
import type {
  AttendanceException,
  DayDetail,
  EmployeeDays,
} from "@/features/attendance/attendance-data"
import { DayDrawer } from "@/features/attendance/history"
import { monthGrid } from "@/features/attendance/rules"
import type { Request } from "@/features/requests/request-data"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/lib/use-format"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { StatusBar } from "@workspace/ui/components/status-chip"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { CorrectionEditor } from "./correction-editor"
import { TABS, type Tab } from "./tabs"

/**
 * FE-11 HR attendance review. The URL holds the tab, the day or month, and the open
 * employee-day (?employee=&day=); the server reads them all.
 */
export function ReviewPage({
  tab,
  today,
  date,
  month,
  grid,
  exceptions,
  corrections,
  detail,
  serverNow,
}: {
  tab: Tab
  today: PlainDate
  date: PlainDate
  month: string
  /** Day tab: everyone on `date`; month tab: everyone over `month`. */
  grid: EmployeeDays[]
  exceptions: AttendanceException[]
  corrections: Request[]
  detail: DayDetail | null
  serverNow: number
}) {
  const t = useTranslations("attendanceReview")
  const format = useFormat()
  const [, setQuery] = useQueryStates(
    {
      tab: parseAsStringLiteral(TABS).withDefault("day"),
      date: parseAsString,
      month: parseAsString,
      employee: parseAsString,
      day: parseAsString,
    },
    { history: "replace", clearOnDefault: true, shallow: false }
  )
  const open = (employee: string, day: PlainDate) => setQuery({ employee, day })
  const range = (day: { firstIn: string | null; lastOut: string | null }) =>
    day.firstIn
      ? `${format.time(day.firstIn)} – ${day.lastOut ? format.time(day.lastOut) : "…"}`
      : "–"

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <Tabs
        value={tab}
        onValueChange={(id) =>
          setQuery({ tab: id as Tab, employee: null, day: null })
        }
      >
        <TabsList>
          {TABS.map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              count={id === "corrections" ? corrections.length : undefined}
              attention
            >
              {t(`tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "day" ? (
        <>
          <div className="max-w-60">
            <DateField
              label={t("date")}
              value={date}
              max={today}
              onChange={(value) =>
                value && setQuery({ date: value === today ? null : value })
              }
            />
          </div>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableCaption className="sr-only">
                {t("dayCaption", { date: format.day(date, "long") })}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.employee")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.inOut")}</TableHead>
                  <TableHead className="text-end">
                    {t("columns.worked")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grid.map(({ employee, days }) => {
                  const day = days[0]
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <button
                          type="button"
                          disabled={!day?.status}
                          onClick={() => open(employee.id, date)}
                          className="font-semibold underline-offset-4 enabled:hover:underline"
                        >
                          <bdi>{employee.name}</bdi>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {day?.status ? (
                            <Status status={day.status} size="sm" />
                          ) : (
                            "–"
                          )}
                          {day?.flags.map((flag) => (
                            <StatusFlag key={flag} flag={flag} />
                          ))}
                        </span>
                      </TableCell>
                      <TableCell className="tabular whitespace-nowrap">
                        <bdi dir="ltr">{day ? range(day) : "–"}</bdi>
                      </TableCell>
                      <TableCell className="tabular text-end">
                        {day?.worked ? format.duration(day.worked) : "–"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}

      {tab === "month" ? (
        <MonthMatrix
          month={month}
          today={today}
          grid={grid}
          onOpen={open}
          onMonth={(next) => setQuery({ month: next })}
        />
      ) : null}

      {tab === "exceptions" ? (
        exceptions.length ? (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {exceptions.map(({ employee, day }) => (
              <li key={`${employee.id}-${day.date}`}>
                <button
                  type="button"
                  onClick={() => open(employee.id, day.date)}
                  className="flex min-h-11 w-full flex-wrap items-center gap-3 px-4 py-3 text-start hover:bg-accent"
                >
                  <span className="w-28 shrink-0 font-semibold">
                    {format.day(day.date)}
                  </span>
                  <bdi className="flex-1">{employee.name}</bdi>
                  {day.status ? <Status status={day.status} size="sm" /> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarCheckIcon}
            title={t("noExceptions.title")}
            body={t("noExceptions.body")}
          />
        )
      ) : null}

      {tab === "corrections" ? (
        corrections.length ? (
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {corrections.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/approvals?request=${request.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-3 px-4 py-3 hover:bg-accent"
                >
                  <span className="w-28 shrink-0 font-semibold">
                    {format.day(request.startDate)}
                  </span>
                  <bdi className="flex-1">{request.requester.name}</bdi>
                  <span className="text-body-sm text-muted-foreground">
                    {[request.data.checkInTime, request.data.checkOutTime]
                      .filter(Boolean)
                      .join(" – ")}
                  </span>
                  <Status status={request.status} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarCheckIcon}
            title={t("noCorrections.title")}
            body={t("noCorrections.body")}
          />
        )
      ) : null}

      <DayDrawer
        detail={detail}
        today={today}
        serverNow={serverNow}
        onClose={() => setQuery({ employee: null, day: null })}
      >
        {detail ? (
          <CorrectionEditor
            key={detail.sessions
              .map((session) => `${session.id}${session.in}${session.out}`)
              .join()}
            detail={detail}
          />
        ) : null}
      </DayDrawer>
    </div>
  )
}

/** calendar.md › attendance-month: employees × days, one status bar per cell. */
export function MonthMatrix({
  month,
  today,
  grid,
  onOpen,
  onMonth,
}: {
  month: string
  today: PlainDate
  grid: EmployeeDays[]
  onOpen: (employee: string, day: PlainDate) => void
  onMonth: (month: string | null) => void
}) {
  const t = useTranslations("attendanceReview")
  const format = useFormat()
  const { weekStart } = useUser().company
  const dates = monthGrid(month, weekStart).filter(
    (date): date is PlainDate => date !== null
  )
  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-body-sm font-semibold">
        {t("month")}
        <input
          type="month"
          value={month}
          max={today.slice(0, 7)}
          onChange={(event) =>
            onMonth(
              event.target.value && event.target.value !== today.slice(0, 7)
                ? event.target.value
                : null
            )
          }
          className="h-control rounded-md border border-input bg-card px-2"
        />
      </label>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="text-caption">
          <caption className="sr-only">
            {t("monthCaption", {
              month: format.day(`${month}-01` as PlainDate, "month"),
            })}
          </caption>
          <thead>
            <tr>
              <th className="sticky start-0 bg-card px-3 py-2 text-start">
                {t("columns.employee")}
              </th>
              {dates.map((date) => (
                <th key={date} className="tabular px-1 py-2 font-semibold">
                  {format.number(Number(date.slice(8)))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map(({ employee, days }) => {
              const byDate = new Map(days.map((day) => [day.date, day]))
              return (
                <tr key={employee.id} className="border-t">
                  <th
                    scope="row"
                    className="sticky start-0 bg-card px-3 py-2 text-start font-semibold whitespace-nowrap"
                  >
                    <bdi>{employee.name}</bdi>
                  </th>
                  {dates.map((date) => {
                    const day = byDate.get(date)
                    const status = day && date <= today ? day.status : null
                    return (
                      <td key={date} className="px-0.5 py-1">
                        <button
                          type="button"
                          disabled={!status || status === "weekend"}
                          onClick={() => onOpen(employee.id, date)}
                          aria-label={`${employee.name}, ${format.day(date)}`}
                          className="flex h-6 w-5 items-end justify-center rounded-xs enabled:hover:bg-accent"
                        >
                          {status && status !== "weekend" ? (
                            <StatusBar status={status} />
                          ) : null}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
