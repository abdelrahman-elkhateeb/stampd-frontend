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
import { useUser } from "@/components/user-provider"
import { useCalendarNames } from "@/features/settings/company-settings"
import { getDirection } from "@/i18n/locale"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
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
import { StatTile } from "@workspace/ui/components/stat-tile"
import { StatusBar } from "@workspace/ui/components/status-chip"
import { ChangesTimeline } from "@workspace/ui/components/timeline"
import { cn } from "@workspace/ui/lib/utils"

import type { Day, DayChange, DayDetail } from "./attendance-data"
import { useNow } from "./clock"
import { addDays, addMonths, monthGrid, monthSummary } from "./rules"
import { SessionList } from "./today-card"

const VIEWS = ["calendar", "list"] as const
const NO_SESSION_REASONS = ["leave", "weekend", "holiday", "not-yet"] as const

/** My attendance by month: summary strip, calendar or list, and the day drawer. */
export function AttendanceHistory({
  month,
  thisMonth,
  firstMonth,
  today,
  days,
  detail,
  serverNow,
}: {
  /** "YYYY-MM", already checked against the bounds. */
  month: string
  thisMonth: string
  firstMonth: string
  today: PlainDate
  days: Day[]
  /** The open day (?day=), read on the server. */
  detail: DayDetail | null
  serverNow: number
}) {
  const t = useTranslations("attendance.history")
  const format = useFormat()
  const { weekStart } = useUser().company
  // The server reads the month and the open day, so URL changes re-render it.
  const [query, setQuery] = useQueryStates(
    {
      month: parseAsString,
      view: parseAsStringLiteral(VIEWS).withDefault("calendar"),
      day: parseAsString,
    },
    { history: "replace", clearOnDefault: true, shallow: false }
  )

  const byDate = new Map(days.map((day) => [day.date, day]))
  const grid = monthGrid(month, weekStart).map((date) =>
    date ? (byDate.get(date) ?? null) : null
  )
  const summary = monthSummary(days)
  const hasData = days.some((day) => day.status && day.date <= today)
  const goTo = (next: string) =>
    setQuery({ month: next === thisMonth ? null : next, day: null })

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
              today={today}
              onOpen={(day) => setQuery({ day })}
            />
          ) : (
            <DayList
              days={days.filter(
                (day) =>
                  day.status && day.status !== "weekend" && day.date <= today
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
        detail={detail}
        today={today}
        serverNow={serverNow}
        onClose={() => setQuery({ day: null })}
      />
    </section>
  )
}

/** docs/design-system/components/calendar.md › attendance-month. */
function MonthGrid({
  grid,
  today,
  onOpen,
}: {
  grid: (Day | null)[]
  today: PlainDate
  onOpen: (day: PlainDate) => void
}) {
  const t = useTranslations("attendance.history")
  const format = useFormat()
  const names = useCalendarNames()
  const statusLabel = useStatusLabel()
  const rtl = getDirection(useLocale() as Locale) === "rtl"
  const { weekStart } = useUser().company
  const ref = useRef<HTMLDivElement>(null)
  const open = grid
    .filter((day) => day?.status && day.date <= today)
    .map((day) => day!.date)
  const [focused, setFocused] = useState<PlainDate | null>(null)
  const active =
    focused && open.includes(focused)
      ? focused
      : open.includes(today)
        ? today
        : open.at(-1)
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
          {week.map((cell, column) => {
            const status = cell && cell.date <= today ? cell.status : null
            return (
              <div key={column} role="gridcell">
                {cell ? (
                  <button
                    type="button"
                    data-day={cell.date}
                    disabled={!status}
                    tabIndex={cell.date === active ? 0 : -1}
                    aria-current={cell.date === today ? "date" : undefined}
                    aria-label={[
                      format.day(cell.date, "long"),
                      status ? statusLabel(status) : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    onFocus={() => setFocused(cell.date)}
                    onClick={() => onOpen(cell.date)}
                    className={cn(
                      "flex h-16 w-full flex-col items-center justify-between rounded-md p-1.5 outline-none sm:h-20 sm:p-2",
                      "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid enabled:hover:bg-accent",
                      (status === "weekend" || !status) &&
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "tabular flex size-7 items-center justify-center rounded-pill text-body-sm font-semibold",
                        cell.date === today &&
                          "border-[1.5px] border-border-strong bg-brand-subtle"
                      )}
                    >
                      {format.number(Number(cell.date.slice(8)))}
                    </span>
                    {status && status !== "weekend" ? (
                      <StatusBar status={status} />
                    ) : null}
                  </button>
                ) : null}
              </div>
            )
          })}
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
  const range = (day: Day) =>
    day.firstIn
      ? `${format.time(day.firstIn)} – ${day.lastOut ? format.time(day.lastOut) : "…"}`
      : null

  return (
    <ul
      aria-label={t("listLabel")}
      className="flex flex-col divide-y rounded-lg border bg-card"
    >
      {[...days].reverse().map((day) => (
        <li key={day.date}>
          <button
            type="button"
            onClick={() => onOpen(day.date)}
            className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-start outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
          >
            <span className="w-24 shrink-0 font-semibold">
              {format.day(day.date)}
            </span>
            <Status status={day.status!} size="sm" />
            <span className="tabular ms-auto flex gap-3 text-body-sm text-muted-foreground">
              {range(day) ? (
                <bdi dir="ltr" className="hidden sm:inline">
                  {range(day)}
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
export function DayDrawer({
  detail,
  today,
  serverNow,
  onClose,
  children,
}: {
  detail: DayDetail | null
  today: PlainDate
  serverNow: number
  onClose: () => void
  /** HR's correction tools; also puts the employee's name in the title. */
  children?: React.ReactNode
}) {
  const t = useTranslations("attendance.day")
  const tAll = useTranslations()
  const format = useFormat()
  const names = useCalendarNames()
  const statusLabel = useStatusLabel()
  const now = useNow(serverNow)
  const day = detail?.day
  const status = day && day.date <= today ? day.status : null
  const sessions = detail?.sessions ?? []
  const history = detail?.history ?? []
  const sessionsText = (value?: { in: string; out?: string }[]) =>
    value?.length
      ? value
          .map(
            (session) =>
              `${format.time(session.in)}–${session.out ? format.time(session.out) : "…"}`
          )
          .join(", ")
      : "—"
  const fieldsOf = (change: DayChange) => [
    ...(change.after.sessions
      ? [
          {
            label: t("fields.sessions"),
            from: sessionsText(change.before.sessions),
            to: sessionsText(change.after.sessions),
          },
        ]
      : []),
    ...(change.after.status !== undefined
      ? [
          {
            label: t("fields.status"),
            from: change.before.status
              ? statusLabel(change.before.status)
              : "—",
            to: change.after.status ? statusLabel(change.after.status) : "—",
          },
        ]
      : []),
  ]

  return (
    <Sheet open={!!status} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="wide" closeLabel={tAll("common.close")}>
        {detail && day && status ? (
          <>
            <SheetHeader>
              <div className="flex flex-col gap-2">
                <SheetTitle>
                  {children
                    ? `${detail.employee.name} · ${format.day(day.date, "long")}`
                    : format.day(day.date, "long")}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex flex-wrap items-center gap-2">
                    <Status status={status} />
                    {day.flags.map((flag) => (
                      <StatusFlag key={flag} flag={flag} />
                    ))}
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
                    now={day.date === today ? now : null}
                    label={t("sessions")}
                  />
                ) : (
                  <p className="text-body text-muted-foreground">
                    {t(
                      `noSessions.${NO_SESSION_REASONS.find((reason) => reason === status) ?? "absent"}`
                    )}
                  </p>
                )}
                {status === "missing" && !children ? (
                  <div className="flex flex-col items-start gap-2 rounded-md bg-warning-bg px-3 py-2 text-body-sm text-warning">
                    <p>{t("missingHint")}</p>
                    <Link
                      href={`/requests/new?type=ATTENDANCE_CORRECTION&date=${day.date}`}
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
              {children}
              <section
                aria-labelledby="day-history"
                className="flex flex-col gap-3"
              >
                <h3 id="day-history" className="text-body-lg font-bold">
                  {t("history")}
                </h3>
                {history.length ? (
                  <ChangesTimeline
                    label={t("history")}
                    labels={{
                      was: t("was"),
                      now: t("now"),
                      changedTo: t("changedTo"),
                      showAll: (count) => t("showAll", { count }),
                    }}
                    events={history.map((change) => ({
                      id: change.id,
                      // Dynamic key: an unknown action shows as the API sent it.
                      action: t.has(`actions.${change.action}` as never)
                        ? t(`actions.${change.action}` as never)
                        : change.action,
                      actor: change.actor ?? t("system"),
                      at: names.dateTime.format(new Date(change.at)),
                      dateTime: change.at,
                      source: t(`source.${change.source}`),
                      fields: fieldsOf(change),
                      reason: change.reason ?? undefined,
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
