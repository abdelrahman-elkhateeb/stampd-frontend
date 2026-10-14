"use client"

import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListIcon,
  SunIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import { useState } from "react"

import { useUser } from "@/components/user-provider"
import { addMonths, monthGrid } from "@/features/attendance/rules"
import { useRequestTypeLabel } from "@/features/requests/request-text"
import { useCalendarNames } from "@/features/settings/company-settings"
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
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import type { CalendarEvent, DayAvailability } from "./calendar-data"

type PersonEvent = Exclude<CalendarEvent, { kind: "HOLIDAY" }>

// Category fills (calendar.md › Event chip); a colleague's day is a neutral "Out".
const TONES: Record<string, string> = {
  LEAVE: "bg-cat-leave",
  WFH: "bg-cat-wfh",
  BUSINESS_TRIP: "bg-cat-trip",
  PERMISSION: "bg-cat-permission",
  OUT: "bg-status-out-bg text-status-out",
}

const VIEWS = ["month", "list"] as const
const ROWS = 3

/** FE-12 company calendar: plans only (never attendance), as the API lets the viewer see them. */
export function CalendarPage({
  month,
  thisMonth,
  today,
  events,
  days,
}: {
  month: string
  thisMonth: string
  today: PlainDate
  events: CalendarEvent[]
  days: DayAvailability[]
}) {
  const t = useTranslations("calendar")
  const format = useFormat()
  const user = useUser()
  const names = useCalendarNames()
  const typeLabel = useRequestTypeLabel()
  const [query, setQuery] = useQueryStates(
    {
      month: parseAsString,
      view: parseAsStringLiteral(VIEWS).withDefault("month"),
      pending: parseAsBoolean.withDefault(false),
      team: parseAsBoolean.withDefault(false),
    },
    { history: "replace", clearOnDefault: true, shallow: false }
  )
  const [openDay, setOpenDay] = useState<PlainDate | null>(null)

  const people = events.filter(
    (event): event is PersonEvent => event.kind !== "HOLIDAY"
  )
  const byDate = new Map(days.map((day) => [day.date, day]))
  const on = (date: PlainDate) =>
    people.filter((event) => event.startDate <= date && date <= event.endDate)
  const kindOf = (event: PersonEvent) =>
    "colleague" in event && event.kind === "OUT" ? "OUT" : event.kind
  const eventName = (event: PersonEvent) =>
    "colleague" in event
      ? t(event.kind === "OUT" ? "out" : "wfh", { name: event.employee.name })
      : `${event.employee.name} · ${
          event.kind === "LEAVE" && event.leaveType?.name
            ? event.leaveType.name
            : typeLabel(event.kind)
        }`
  const summary = (date: PlainDate) => {
    const day = byDate.get(date)
    if (!day?.working || (!day.out && !day.wfh)) return null
    return t("summary", { out: day.out, wfh: day.wfh })
  }
  const goTo = (next: string) =>
    setQuery({ month: next === thisMonth ? null : next })
  const grid = monthGrid(month, user.company.weekStart)
  const listDays = grid.filter(
    (date): date is PlainDate =>
      date !== null && (on(date).length > 0 || !!byDate.get(date)?.holiday)
  )

  function chip(event: PersonEvent, key: number) {
    const tentative = "tentative" in event && event.tentative
    const label = tentative
      ? t("pendingPrefix", { name: eventName(event) })
      : eventName(event)
    const className = cn(
      "block truncate rounded-xs px-1.5 py-0.5 text-caption font-semibold text-cat-foreground",
      TONES[kindOf(event)],
      tentative &&
        "border-[1.5px] border-dashed border-border-strong bg-card bg-none"
    )
    return "requestId" in event ? (
      <Link
        key={key}
        href={`/requests/${event.requestId}`}
        className={className}
      >
        <bdi>{label}</bdi>
      </Link>
    ) : (
      <span key={key} className={className}>
        <bdi>{label}</bdi>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("previous")}
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
          onClick={() => goTo(addMonths(month, 1))}
        >
          <ChevronRightIcon aria-hidden className="flip-rtl" />
        </Button>
        {month === thisMonth ? null : (
          <Button variant="ghost" size="sm" onClick={() => goTo(thisMonth)}>
            {t("today")}
          </Button>
        )}
        <div className="ms-auto flex flex-wrap items-center gap-4">
          {user.role === "employee" ? null : (
            <label className="flex items-center gap-2 text-body-sm">
              <Switch
                checked={query.team}
                onCheckedChange={(team) => setQuery({ team })}
              />
              {t("myTeam")}
            </label>
          )}
          <label className="flex items-center gap-2 text-body-sm">
            <Switch
              checked={query.pending}
              onCheckedChange={(pending) => setQuery({ pending })}
            />
            {t("showPending")}
          </label>
          <SegmentedControl
            aria-label={t("view")}
            value={query.view}
            onValueChange={(view) => setQuery({ view })}
            options={[
              { value: "month", label: t("month"), icon: CalendarDaysIcon },
              { value: "list", label: t("list"), icon: ListIcon },
            ]}
          />
        </div>
      </div>

      {query.view === "month" ? (
        <div
          role="grid"
          aria-label={t("gridLabel")}
          className="flex flex-col gap-1 overflow-x-auto rounded-lg border bg-card p-2"
        >
          <div role="row" className="grid min-w-[42rem] grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={index}
                role="columnheader"
                className="py-1 text-center text-caption font-semibold text-muted-foreground"
              >
                {names.dayShort[(user.company.weekStart + index) % 7]}
              </span>
            ))}
          </div>
          {Array.from({ length: grid.length / 7 }, (_, week) => (
            <div
              key={week}
              role="row"
              className="grid min-w-[42rem] grid-cols-7 gap-1"
            >
              {grid.slice(week * 7, week * 7 + 7).map((date, column) => {
                if (!date) return <div key={column} role="gridcell" />
                const day = byDate.get(date)
                const dayEvents = on(date)
                const rows = ROWS - (day?.holiday ? 1 : 0)
                const more = dayEvents.length - rows
                return (
                  <div
                    key={date}
                    role="gridcell"
                    aria-current={date === today ? "date" : undefined}
                    aria-label={[
                      format.day(date, "long"),
                      summary(date),
                      day?.holiday,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    className={cn(
                      "flex min-h-32 flex-col gap-1 rounded-md p-1.5",
                      day && !day.working && "bg-muted text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "tabular flex size-6 items-center justify-center rounded-pill text-body-sm font-semibold",
                          date === today &&
                            "border-[1.5px] border-border-strong bg-brand-subtle"
                        )}
                      >
                        {format.number(Number(date.slice(8)))}
                      </span>
                      {summary(date) ? (
                        <span className="truncate text-caption text-muted-foreground">
                          {summary(date)}
                        </span>
                      ) : null}
                    </div>
                    {day?.holiday ? (
                      <span className="flex items-center gap-1 truncate rounded-xs bg-status-holiday-bg px-1.5 py-0.5 text-caption font-semibold text-status-holiday">
                        <SunIcon aria-hidden className="size-3 shrink-0" />
                        <bdi className="truncate">{day.holiday}</bdi>
                      </span>
                    ) : null}
                    {dayEvents.slice(0, more > 0 ? rows - 1 : rows).map(chip)}
                    {more > 0 ? (
                      <button
                        type="button"
                        onClick={() => setOpenDay(date)}
                        className="w-fit text-caption font-semibold underline underline-offset-2"
                      >
                        {t("more", { count: more + 1 })}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : listDays.length ? (
        <ul className="flex flex-col gap-4">
          {listDays.map((date) => (
            <li key={date} className="flex flex-col gap-2">
              <h2 className="sticky top-0 bg-background py-1 text-body font-bold">
                {format.day(date, "long")}
                {byDate.get(date)?.holiday ? (
                  <span className="ms-2 font-normal text-status-holiday">
                    {byDate.get(date)?.holiday}
                  </span>
                ) : null}
              </h2>
              <div className="flex flex-col gap-1">{on(date).map(chip)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={CalendarDaysIcon}
          title={t("empty.title")}
          body={t("empty.body")}
        />
      )}

      <Sheet
        open={openDay !== null}
        onOpenChange={(open) => !open && setOpenDay(null)}
      >
        <SheetContent closeLabel={t("close")}>
          {openDay ? (
            <>
              <SheetHeader>
                <SheetTitle>{format.day(openDay, "long")}</SheetTitle>
              </SheetHeader>
              <SheetBody className="flex flex-col gap-1">
                {on(openDay).map(chip)}
              </SheetBody>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
