"use client"

import { ArrowRightIcon, TriangleAlertIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Status } from "@/components/status"
import { useUser } from "@/components/user-provider"
import type { Today } from "@/features/attendance/attendance-data"
import { TodayCard } from "@/features/attendance/today-card"
import type { Balance } from "@/features/employees/employee-data"
import { BalanceCard } from "@/features/leave/balance-card"
import { SetupChecklist } from "@/features/onboarding/setup-checklist"
import type {
  LeaveTypeName,
  Request,
  RequestType,
} from "@/features/requests/request-data"
import {
  useRequestText,
  useRequestTypeLabel,
} from "@/features/requests/request-text"
import type { CompanySettings } from "@/features/settings/settings-data"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/lib/use-format"
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import { StatTile } from "@workspace/ui/components/stat-tile"
import { cn } from "@workspace/ui/lib/utils"

import type {
  AdminSummary,
  DayCounts,
  ManagerSummary,
  TimeOff,
} from "./dashboard-data"

// Today's buckets with their status colours, in reading order.
const BUCKETS: [keyof DayCounts, string][] = [
  ["present", "bg-status-present"],
  ["late", "bg-status-late"],
  ["absent", "bg-status-absent"],
  ["wfh", "bg-status-wfh"],
  ["onLeave", "bg-status-leave"],
  ["businessTrip", "bg-status-trip"],
  ["notYetCheckedIn", "bg-status-not-yet"],
]

/** FE-09 (everyone), FE-10 team section (managers), FE-13 company section (admins). */
export function DashboardPage({
  today,
  hours,
  balances,
  pending,
  upcoming,
  manager,
  admin,
  types,
  leaveTypes,
}: {
  today: Today
  hours: Pick<CompanySettings, "workStart" | "workEnd" | "graceMinutes">
  balances: Balance[]
  pending: Request[]
  upcoming: TimeOff[]
  manager: ManagerSummary | null
  admin: AdminSummary | null
  types: RequestType[]
  leaveTypes: LeaveTypeName[]
}) {
  const t = useTranslations("dashboard")
  const user = useUser()
  const text = useRequestText({ types, leaveTypes })
  const format = useFormat()

  return (
    <div className="flex flex-col gap-8">
      {/* The mobile top bar already greets; the heading stays for screen readers. */}
      <div className="flex flex-col gap-1 max-md:sr-only">
        <h1 className="text-h2 font-bold">
          {t("greeting", { name: user.name.split(" ")[0] ?? "" })}
        </h1>
        <p className="text-muted-foreground">
          {format.day(today.date, "long")}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* Mobile: Today above the fold (layout.md). */}
        <TodayCard today={today} hours={hours} missed={null} />
        <div className="flex flex-col gap-6">
          <Section title={t("balances")} href="/leave" more={t("myLeave")}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {balances.map((balance) => (
                <BalanceCard
                  key={balance.leaveType.id}
                  balance={balance}
                  variant="tile"
                />
              ))}
            </div>
          </Section>
          <Section
            title={t("pending", { count: pending.length })}
            href="/requests?status=pending"
            more={t("myRequests")}
          >
            {pending.length ? (
              <List>
                {pending.map((request) => (
                  <li key={request.id}>
                    <RowLink href={`/requests/${request.id}`}>
                      <span className="min-w-0 flex-1 truncate">
                        <bdi>{text.title(request)}</bdi>
                        <span className="block text-body-sm text-muted-foreground">
                          {text.when(request)}
                        </span>
                      </span>
                      <Status status={request.status} size="sm" />
                    </RowLink>
                  </li>
                ))}
              </List>
            ) : (
              <Empty>{t("noPending")}</Empty>
            )}
          </Section>
          <Section title={t("upcoming")}>
            <TimeOffList items={upcoming} empty={t("noUpcoming")} />
          </Section>
        </div>
      </div>

      {admin ? (
        <div className="max-w-2xl">
          <SetupChecklist />
        </div>
      ) : null}
      {manager ? <TeamSection summary={manager} /> : null}
      {admin ? <CompanySection summary={admin} /> : null}
    </div>
  )
}

function TeamSection({ summary }: { summary: ManagerSummary }) {
  const t = useTranslations("dashboard")
  const format = useFormat()
  const { teamToday, teamThisMonth } = summary
  return (
    <section aria-labelledby="team-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="team-title" className="text-h3 font-bold">
          {t("team.title")}
        </h2>
        <Link
          href="/approvals"
          className="inline-flex items-center gap-1 text-body-sm font-semibold underline underline-offset-4"
        >
          {t("team.approvals", { count: summary.pendingApprovals.total })}
          <ArrowRightIcon aria-hidden className="flip-rtl size-3.5" />
        </Link>
      </div>
      <TodayTiles
        working={teamToday.working}
        expected={teamToday.expected}
        counts={teamToday.counts}
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section title={t("team.outNext14")}>
          <TimeOffList
            items={summary.teamOutNext14Days}
            empty={t("team.nobodyOut")}
            names
          />
        </Section>
        <Section title={t("team.thisMonth")}>
          <div className="grid grid-cols-3 gap-3">
            {(["late", "absences", "missingCheckouts"] as const).map((key) => (
              <StatTile
                key={key}
                label={t(`month.${key}`)}
                value={teamThisMonth[key]}
                formattedValue={format.number(teamThisMonth[key])}
              />
            ))}
          </div>
        </Section>
      </div>
    </section>
  )
}

function CompanySection({ summary }: { summary: AdminSummary }) {
  const t = useTranslations("dashboard")
  const format = useFormat()
  const typeLabel = useRequestTypeLabel()
  const { companyToday, exceptionsThisMonth } = summary

  return (
    <section aria-labelledby="company-title" className="flex flex-col gap-4">
      <h2 id="company-title" className="text-h3 font-bold">
        {t("company.title")}
      </h2>
      <TodayTiles
        working={companyToday.working}
        expected={companyToday.expected}
        counts={companyToday.counts}
      />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section
          title={t("company.pendingByType")}
          href="/approvals"
          more={t("company.review")}
        >
          {summary.pendingRequests.length ? (
            <List>
              {summary.pendingRequests.map((row) => (
                <li
                  key={row.type}
                  className="flex items-center gap-3 px-4 py-3 text-body"
                >
                  <span className="flex-1">
                    <bdi>{typeLabel(row.type)}</bdi>
                  </span>
                  {row.overdue ? (
                    <span className="flex items-center gap-1 text-body-sm text-warning">
                      <TriangleAlertIcon aria-hidden className="size-3.5" />
                      {t("company.overdue", { count: row.overdue })}
                    </span>
                  ) : null}
                  <span className="tabular font-bold">
                    {format.number(row.count)}
                  </span>
                </li>
              ))}
            </List>
          ) : (
            <Empty>{t("company.noPending")}</Empty>
          )}
        </Section>
        <Section
          title={t("company.exceptions")}
          href="/attendance-review?tab=exceptions"
          more={t("company.review")}
        >
          <div className="grid grid-cols-2 gap-3">
            {(["absences", "missingCheckouts"] as const).map((key) => (
              <StatTile
                key={key}
                label={t(`month.${key}`)}
                value={exceptionsThisMonth[key]}
                formattedValue={format.number(exceptionsThisMonth[key])}
              />
            ))}
          </div>
        </Section>
        <Section
          title={t("company.leaveUsage", { year: summary.leaveUsage.year })}
        >
          <List>
            {summary.leaveUsage.items.map((item) => {
              const taken = item.used + item.upcoming
              return (
                <li
                  key={item.leaveType.id}
                  className="flex flex-col gap-1.5 px-4 py-3"
                >
                  <span className="flex justify-between gap-3 text-body">
                    <bdi className="font-semibold">{item.leaveType.name}</bdi>
                    <span className="tabular text-muted-foreground">
                      {t("company.usage", {
                        taken: format.number(taken),
                        entitled: format.number(item.entitled),
                      })}
                    </span>
                  </span>
                  <div
                    role="progressbar"
                    aria-label={item.leaveType.name}
                    aria-valuemin={0}
                    aria-valuemax={item.entitled}
                    aria-valuenow={taken}
                    className="h-2.5 overflow-hidden rounded-pill bg-muted shadow-[inset_0_0_0_1px_var(--border-strong)]"
                  >
                    <div
                      className="h-full bg-cat-leave"
                      style={{
                        width: `${item.entitled ? Math.min(100, (taken / item.entitled) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </List>
        </Section>
        <Section title={t("company.trend")}>
          <Trend days={summary.attendanceTrend} />
        </Section>
      </div>
    </section>
  )
}

/** 30 working days of present / late / WFH / absent, stacked (data-viz: a table fallback for readers). */
function Trend({ days }: { days: AdminSummary["attendanceTrend"] }) {
  const t = useTranslations("dashboard")
  const format = useFormat()
  const working = days.filter((day) => day.working)
  const max = Math.max(
    1,
    ...working.map((day) => day.present + day.late + day.wfh + day.absent)
  )
  const parts = [
    ["present", "bg-status-present"],
    ["late", "bg-status-late"],
    ["wfh", "bg-status-wfh"],
    ["absent", "bg-status-absent"],
  ] as const

  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden className="flex h-32 items-end gap-0.5">
        {working.map((day) => (
          <div
            key={day.date}
            title={format.day(day.date)}
            className="flex flex-1 flex-col-reverse overflow-hidden rounded-t-xs"
            style={{
              height: `${((day.present + day.late + day.wfh + day.absent) / max) * 100}%`,
            }}
          >
            {parts.map(([key, className]) =>
              day[key] ? (
                <div
                  key={key}
                  className={className}
                  style={{ flexGrow: day[key] }}
                />
              ) : null
            )}
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-3 text-caption text-muted-foreground">
        {parts.map(([key, className]) => (
          <li key={key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn("size-2.5 rounded-xs", className)}
            />
            {t(`buckets.${key}`)}
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>{t("company.trend")}</caption>
        <thead>
          <tr>
            <th>{t("date")}</th>
            {parts.map(([key]) => (
              <th key={key}>{t(`buckets.${key}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {working.map((day) => (
            <tr key={day.date}>
              <td>{format.day(day.date)}</td>
              {parts.map(([key]) => (
                <td key={key}>{day[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TodayTiles({
  working,
  expected,
  counts,
}: {
  working: boolean
  expected: number
  counts: DayCounts
}) {
  const t = useTranslations("dashboard")
  const format = useFormat()
  if (!working) return <Empty>{t("notWorking")}</Empty>
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body-sm text-muted-foreground">
        {t("expected", { count: expected })}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {BUCKETS.map(([key, marker]) => (
          <StatTile
            key={key}
            label={t(`buckets.${key}`)}
            value={counts[key]}
            formattedValue={format.number(counts[key])}
            markerClassName={marker}
          />
        ))}
      </div>
    </div>
  )
}

function TimeOffList({
  items,
  empty,
  names = false,
}: {
  items: TimeOff[]
  empty: string
  names?: boolean
}) {
  const format = useFormat()
  const typeLabel = useRequestTypeLabel()
  if (!items.length) return <Empty>{empty}</Empty>
  return (
    <List>
      {items.map((item) => (
        <li key={item.requestId}>
          <RowLink href={`/requests/${item.requestId}`}>
            <span className="min-w-0 flex-1 truncate">
              <bdi>
                {names
                  ? `${item.employee.name} · ${typeLabel(item.type)}`
                  : typeLabel(item.type)}
              </bdi>
            </span>
            <span className="text-body-sm text-muted-foreground">
              {item.startDate === item.endDate
                ? format.day(item.startDate as PlainDate)
                : format.dayRange(item.startDate, item.endDate)}
            </span>
          </RowLink>
        </li>
      ))}
    </List>
  )
}

function Section({
  title,
  href,
  more,
  children,
}: {
  title: string
  href?: string
  more?: string
  children: React.ReactNode
}) {
  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row flex-wrap items-baseline justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {href && more ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-body-sm font-semibold underline underline-offset-4"
          >
            {more}
            <ArrowRightIcon aria-hidden className="flip-rtl size-3.5" />
          </Link>
        ) : null}
      </CardHeader>
      {children}
    </Card>
  )
}

const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="flex flex-col divide-y rounded-md border">{children}</ul>
)

const RowLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => (
  <Link
    href={href}
    className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-body outline-none hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
  >
    {children}
  </Link>
)

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-body text-muted-foreground">{children}</p>
)
