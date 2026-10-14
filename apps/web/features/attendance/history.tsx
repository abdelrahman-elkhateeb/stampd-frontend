"use client"

import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs"
import { useRef, useState } from "react"

import { Status, StatusFlag, useStatusLabel } from "@/components/status"
import { useCalendarNames } from "@/features/settings/company-settings"
import { getDirection } from "@/i18n/locale"
import type { Locale } from "@/i18n/routing"
import { DEMO_USER } from "@/lib/demo-user"
import { isPlainDate } from "@/lib/format"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { SegmentedControl } from "@workspace/ui/components/segmented-control"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"
import { StatTile } from "@workspace/ui/components/stat-tile"
import {
  StatusBar,
  type AttendanceStatus,
} from "@workspace/ui/components/status-chip"
import { ChangesTimeline } from "@workspace/ui/components/timeline"
import { cn } from "@workspace/ui/lib/utils"

import { companyToday, demoRules, type DayRecord } from "./demo-data"
import {
  addDays,
  addMonths,
  dayStatus,
  monthGrid,
  monthSummary,
  workedMinutes,
  type AttendanceRules,
} from "./rules"
import { useAttendanceRecords, useNow } from "./store"
import { SessionList } from "./today-card"

type Day = {
  day: PlainDate
  record?: DayRecord
  status: AttendanceStatus | null
  worked: number
}

const VIEWS = ["calendar", "list"] as const
const MONTH = /^\d{4}-\d{2}$/
const NO_SESSION_REASONS = ["leave", "weekend", "holiday", "not-yet"] as const

/** My attendance by month: summary strip, calendar or list, and the day drawer. */
export function AttendanceHistory() {
  const t = useTranslations("attendance.history")
  const format = useFormat()
  const records = useAttendanceRecords()
  const now = useNow()
  const [query, setQuery] = useQueryStates(
    {
      month: parseAsString,
      view: parseAsStringLiteral(VIEWS).withDefault("calendar"),
      day: parseAsString,
    },
    { history: "replace", clearOnDefault: true }
  )

  if (!records || now === null) {
    return (
      <SkeletonGroup label={t("loading")} className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </SkeletonGroup>
    )
  }

  const rules = demoRules(companyToday(now))
  const thisMonth = rules.today.slice(0, 7)
  const firstMonth = rules.since.slice(0, 7)
  const month =
    query.month &&
    MONTH.test(query.month) &&
    query.month >= firstMonth &&
    query.month <= thisMonth
      ? query.month
      : thisMonth
  const byDate = new Map(records.map((record) => [record.date, record]))
  const describe = (day: PlainDate): Day => {
    const record = byDate.get(day)
    return {
      day,
      record,
      status: dayStatus(day, record, rules),
      worked: workedMinutes(
        record?.sessions ?? [],
        day === rules.today ? now : null
      ),
    }
  }
  const grid = monthGrid(month, DEMO_USER.company.weekStart).map((day) =>
    day ? describe(day) : null
  )
  const days = grid.filter((day) => day !== null)
  const summary = monthSummary(days)
  const hasData = days.some((day) => day.status && day.day < rules.today)
  const openDay =
    query.day && isPlainDate(query.day) ? describe(query.day) : null
  const goTo = (next: string) =>
    setQuery({ month: next === thisMonth ? null : next })

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="history-title" className="text-h3 font-bold">
          {t("title")}
        </h2>
        <SegmentedControl
          aria-label={t("view")}
          value={query.view}
          onValueChange={(view) => setQuery({ view })}
          options={[
            { value: "calendar", label: t("calendar"), icon: CalendarDaysIcon },
            { value: "list", label: t("list"), icon: ListIcon },
          ]}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("previous")}
          disabled={month <= firstMonth}
          onClick={() => goTo(addMonths(month, -1))}
        >
          <ChevronLeftIcon aria-hidden className="flip-rtl" />
        </Button>
        <p
          aria-live="polite"
          className="min-w-36 text-center text-h4 font-bold"
        >
          {format.day(`${month}-01` as PlainDate, "month")}
        </p>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("next")}
          disabled={month >= thisMonth}
          onClick={() => goTo(addMonths(month, 1))}
        >
          <ChevronRightIcon aria-hidden className="flip-rtl" />
        </Button>
        {month === thisMonth ? null : (
          <Button variant="ghost" size="sm" onClick={() => goTo(thisMonth)}>
            {t("thisMonth")}
          </Button>
        )}
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label={t("summary.attended")}
              value={summary.attended}
              formattedValue={format.number(summary.attended)}
              markerClassName="bg-status-present"
            />
            <StatTile
              label={t("summary.late")}
              value={summary.late}
              formattedValue={format.number(summary.late)}
              markerClassName="bg-status-late"
            />
            <StatTile
              label={t("summary.absent")}
              value={summary.absent}
              formattedValue={format.number(summary.absent)}
              markerClassName="bg-status-absent"
            />
            <StatTile
              label={t("summary.worked")}
              value={summary.worked}
              formattedValue={format.duration(summary.worked)}
            />
          </div>
          {query.view === "calendar" ? (
            <MonthGrid
              grid={grid}
              rules={rules}
              onOpen={(day) => setQuery({ day })}
            />
          ) : (
            <DayList
              days={days.filter(
                (day) => day.status && day.status !== "weekend"
              )}
              onOpen={(day) => setQuery({ day })}
            />
          )}
        </>
      ) : (
        <EmptyState
          title={t("empty.title")}
          body={t("empty.body")}
          icon={CalendarDaysIcon}
        />
      )}

      <DayDrawer
        day={openDay?.status ? openDay : null}
        rules={rules}
        now={now}
        onClose={() => setQuery({ day: null })}
      />
    </section>
  )
}

/** docs/design-system/components/calendar.md › attendance-month. */
function MonthGrid({
  grid,
  rules,
  onOpen,
}: {
  grid: (Day | null)[]
  rules: AttendanceRules
  onOpen: (day: PlainDate) => void
}) {
  const t = useTranslations("attendance.history")
  const format = useFormat()
  const names = useCalendarNames()
  const statusLabel = useStatusLabel()
  const rtl = getDirection(useLocale() as Locale) === "rtl"
  const ref = useRef<HTMLDivElement>(null)
  const open = grid.filter((day) => day?.status).map((day) => day!.day)
  const [focused, setFocused] = useState<PlainDate | null>(null)
  const active =
    focused && open.includes(focused)
      ? focused
      : open.includes(rules.today)
        ? rules.today
        : open.at(-1)
  const weekStart = DEMO_USER.company.weekStart
  const weeks = Array.from({ length: grid.length / 7 }, (_, index) =>
    grid.slice(index * 7, index * 7 + 7)
  )

  function onKeyDown(event: React.KeyboardEvent) {
    const step = {
      ArrowRight: rtl ? -1 : 1,
      ArrowLeft: rtl ? 1 : -1,
      ArrowDown: 7,
      ArrowUp: -7,
    }[event.key]
    if (!step || !active) return
    event.preventDefault()
    const target = addDays(active, step)
    if (!open.includes(target)) return
    setFocused(target)
    ref.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${target}"]`)
      ?.focus()
  }

  return (
    <div
      ref={ref}
      role="grid"
      aria-label={t("calendarLabel")}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-1 rounded-lg border bg-card p-2 sm:p-3"
    >
      <div role="row" className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <span
            key={index}
            role="columnheader"
            className="py-1 text-center text-caption font-semibold text-muted-foreground"
          >
            {names.dayShort[(weekStart + index) % 7]}
          </span>
        ))}
      </div>
      {weeks.map((week, index) => (
        <div key={index} role="row" className="grid grid-cols-7 gap-1">
          {week.map((cell, column) => (
            <div key={column} role="gridcell">
              {cell ? (
                <button
                  type="button"
                  data-day={cell.day}
                  disabled={!cell.status}
                  tabIndex={cell.day === active ? 0 : -1}
                  aria-current={cell.day === rules.today ? "date" : undefined}
                  aria-label={[
                    format.day(cell.day, "long"),
                    cell.status ? statusLabel(cell.status) : null,
                    rules.holidays.get(cell.day),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  onFocus={() => setFocused(cell.day)}
                  onClick={() => onOpen(cell.day)}
                  className={cn(
                    "flex h-16 w-full flex-col items-center justify-between rounded-md p-1.5 outline-none sm:h-20 sm:p-2",
                    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid enabled:hover:bg-accent",
                    (cell.status === "weekend" || !cell.status) &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "tabular flex size-7 items-center justify-center rounded-pill text-body-sm font-semibold",
                      cell.day === rules.today &&
                        "border-[1.5px] border-border-strong bg-brand-subtle"
                    )}
                  >
                    {format.number(Number(cell.day.slice(8)))}
                  </span>
                  {cell.status && cell.status !== "weekend" ? (
                    <StatusBar status={cell.status} />
                  ) : null}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function DayList({
  days,
  onOpen,
}: {
  days: Day[]
  onOpen: (day: PlainDate) => void
}) {
  const t = useTranslations("attendance.history")
  const format = useFormat()
  const range = (record?: DayRecord) => {
    const sessions = record?.sessions ?? []
    const first = sessions[0]
    const last = sessions.at(-1)
    if (!first) return null
    return `${format.time(first.in)} – ${last?.out ? format.time(last.out) : "…"}`
  }

  return (
    <ul
      aria-label={t("listLabel")}
      className="flex flex-col divide-y rounded-lg border bg-card"
    >
      {[...days].reverse().map((day) => (
        <li key={day.day}>
          <button
            type="button"
            onClick={() => onOpen(day.day)}
            className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-start outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
          >
            <span className="w-24 shrink-0 font-semibold">
              {format.day(day.day)}
            </span>
            <Status status={day.status!} size="sm" />
            <span className="tabular ms-auto flex gap-3 text-body-sm text-muted-foreground">
              {range(day.record) ? (
                <bdi dir="ltr" className="hidden sm:inline">
                  {range(day.record)}
                </bdi>
              ) : null}
              {day.worked ? <span>{format.duration(day.worked)}</span> : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** docs/design-system/components/drawer.md › day detail, with the change timeline. */
function DayDrawer({
  day,
  rules,
  now,
  onClose,
}: {
  day: Day | null
  rules: AttendanceRules
  now: number
  onClose: () => void
}) {
  const t = useTranslations("attendance.day")
  const tAll = useTranslations()
  const format = useFormat()
  const names = useCalendarNames()
  const corrections = day?.record?.corrections ?? []
  const sessions = day?.record?.sessions ?? []

  return (
    <Sheet open={day !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="wide" closeLabel={tAll("common.close")}>
        {day ? (
          <>
            <SheetHeader>
              <div className="flex flex-col gap-2">
                <SheetTitle>{format.day(day.day, "long")}</SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap items-center gap-2">
                    <Status status={day.status!} />
                    {corrections.length ? (
                      <StatusFlag flag="corrected" />
                    ) : null}
                  </div>
                </SheetDescription>
              </div>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-6">
              <section
                aria-labelledby="day-sessions"
                className="flex flex-col gap-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id="day-sessions" className="text-body-lg font-bold">
                    {t("sessions")}
                  </h3>
                  {day.worked ? (
                    <span className="text-body-sm text-muted-foreground">
                      {t("total", { duration: format.duration(day.worked) })}
                    </span>
                  ) : null}
                </div>
                {sessions.length ? (
                  <SessionList
                    sessions={sessions}
                    now={day.day === rules.today ? now : null}
                    label={t("sessions")}
                  />
                ) : (
                  <p className="text-body text-muted-foreground">
                    {rules.holidays.get(day.day) ??
                      t(
                        `noSessions.${NO_SESSION_REASONS.find((reason) => reason === day.status) ?? "absent"}`
                      )}
                  </p>
                )}
                {day.status === "missing" ? (
                  <div className="flex flex-col items-start gap-2 rounded-md bg-warning-bg px-3 py-2 text-body-sm text-warning">
                    <p>{t("missingHint")}</p>
                    <Link
                      href={`/requests/new?type=ATTENDANCE_CORRECTION&date=${day.day}`}
                      className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
                    >
                      {t("requestCorrection")}
                      <ArrowRightIcon
                        aria-hidden
                        className="flip-rtl size-3.5"
                      />
                    </Link>
                  </div>
                ) : null}
              </section>
              <section
                aria-labelledby="day-history"
                className="flex flex-col gap-3"
              >
                <h3 id="day-history" className="text-body-lg font-bold">
                  {t("history")}
                </h3>
                {corrections.length ? (
                  <ChangesTimeline
                    label={t("history")}
                    labels={{
                      was: t("was"),
                      now: t("now"),
                      changedTo: t("changedTo"),
                      showAll: (count) => t("showAll", { count }),
                    }}
                    events={[...corrections].reverse().map((change) => ({
                      id: change.id,
                      action: t("corrected"),
                      actor: change.actor,
                      at: names.dateTime.format(new Date(change.at)),
                      dateTime: change.at,
                      source:
                        change.source === "request"
                          ? t("fromRequest", { id: change.requestId ?? "" })
                          : t("manual"),
                      fields: change.fields.map((field) => ({
                        label: t(`fields.${field.field}`),
                        from: field.from ? format.time(field.from) : "—",
                        to: format.time(field.to),
                      })),
                      reason: change.reason,
                    }))}
                  />
                ) : (
                  <p className="text-body text-muted-foreground">
                    {t("noChanges")}
                  </p>
                )}
              </section>
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
