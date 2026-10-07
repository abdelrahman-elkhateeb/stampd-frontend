import { notFound } from "next/navigation"

import { listEmployees } from "@/api/generated/server/employees/employees"
import { devRoutesEnabled } from "@/lib/auth/routes"
import {
  formatDateTime,
  formatDay,
  formatDuration,
  formatTime,
  todayInZone,
} from "@/lib/format"
import { getCurrentUser } from "@/lib/current-user"
import type { Locale } from "@/i18n/routing"

import { ClientCheck } from "./client-check"

// Dev-only tool (English only, never in production): exercises the data layer end to end.
export default async function ApiCheckPage({
  params,
}: PageProps<"/[locale]/dev/api">) {
  if (!devRoutesEnabled()) notFound()
  const locale = (await params).locale as Locale

  const user = await getCurrentUser()
  // Server-side call: 403 for employees renders the "no access" page via serverFetch.
  const employees = await listEmployees({ page: 1, pageSize: 5, sort: "name" })
  const ctx = { locale, timeZone: user.company.timezone }
  const sampleTimestamp = "2026-10-06T22:30:00Z"

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <h1 className="text-h2 font-bold">API check</h1>

      <section className="flex flex-col gap-2" aria-labelledby="server-user">
        <h2 id="server-user" className="text-h4 font-semibold">
          Current user (server)
        </h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-body-sm">
          <dt>Name</dt>
          <dd data-testid="user-name">
            <bdi>{user.name}</bdi>
          </dd>
          <dt>Role</dt>
          <dd>{user.role}</dd>
          <dt>Company timezone</dt>
          <dd dir="ltr" className="text-start">
            {user.company.timezone}
          </dd>
        </dl>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="formatting">
        <h2 id="formatting" className="text-h4 font-semibold">
          Company-time formatting
        </h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-body-sm">
          <dt>Today (company)</dt>
          <dd>
            {formatDay(todayInZone(user.company.timezone), locale, "long")}
          </dd>
          <dt>{sampleTimestamp}</dt>
          <dd data-testid="sample-timestamp">
            {formatDateTime(sampleTimestamp, ctx)}{" "}
            {formatTime(sampleTimestamp, ctx)}
          </dd>
          <dt>Plain date 2026-10-07</dt>
          <dd>{formatDay("2026-10-07", locale, "long")}</dd>
          <dt>465 minutes</dt>
          <dd>{formatDuration(465, locale)}</dd>
        </dl>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="employees">
        <h2 id="employees" className="text-h4 font-semibold">
          Employees (server, {employees.meta.totalItems} total)
        </h2>
        <ul data-testid="employee-list" className="text-body-sm">
          {employees.items.map((employee) => (
            <li key={employee.id}>
              <bdi>{employee.name}</bdi> · {employee.department} ·{" "}
              {formatDay(employee.joinedOn, locale)}
            </li>
          ))}
        </ul>
      </section>

      <ClientCheck />
    </main>
  )
}
