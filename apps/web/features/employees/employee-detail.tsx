"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  MailIcon,
  PencilIcon,
  SlidersHorizontalIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { notFound } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { ReasonField, StepperField } from "@/components/form-fields"
import { Status } from "@/components/status"
import { DEMO_LEAVE_TYPES } from "@/features/settings/demo-data"
import { getIntlLocale } from "@/i18n/locale"
import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { DEMO_USER } from "@/lib/demo-user"
import { codeErrorMap } from "@/lib/forms"
import { useFormat } from "@/lib/use-format"
import { PersonAvatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { FieldGroup } from "@workspace/ui/components/field"
import { LeaveIcon } from "@workspace/ui/components/icon-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { notify } from "@workspace/ui/components/sonner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { ChangesTimeline } from "@workspace/ui/components/timeline"
import { cn } from "@workspace/ui/lib/utils"

import type { Employee, EmployeeChange, LedgerEntry } from "./demo-data"
import { EmployeeDrawer } from "./employee-drawer"
import { NoData } from "./employees-list"
import { directReports, ledgerRows } from "./rules"
import { change, updateStore, useEmployeesStore } from "./store"

const TRACKED = DEMO_LEAVE_TYPES.filter(
  (type) => type.tracked && !type.archived
)
const YEAR = 2026

export function EmployeeDetail({ id }: { id: string }) {
  const t = useTranslations("employees")
  const format = useFormat()
  const store = useEmployeesStore()
  const employee = store.employees.find((item) => item.id === id)
  const [editing, setEditing] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  if (!employee) notFound()

  const department = store.departments.find(
    (item) => item.id === employee.departmentId
  )
  const manager = store.employees.find((item) => item.id === employee.managerId)
  const isMe = employee.id === DEMO_USER.id

  function setStatus(
    status: Employee["status"],
    action: EmployeeChange["action"]
  ) {
    updateStore((current) => ({
      ...current,
      employees: current.employees.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
      history: [
        ...current.history,
        change(id, action, [
          { field: "status", from: employee!.status, to: status },
        ]),
      ],
    }))
  }

  return (
    <div data-density="compact" className="flex flex-col gap-6">
      <Link
        href="/employees"
        className="-mb-2 inline-flex w-fit items-center gap-1.5 text-body-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="flip-rtl size-4" />
        {t("title")}
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar name={employee.name} userId={employee.id} size={56} />
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h2 font-bold">
              <bdi>{employee.name}</bdi>
            </h1>
            <Status status={employee.status} />
          </div>
          <p className="text-muted-foreground">
            <bdi>{employee.jobTitle}</bdi>
            {department ? (
              <>
                {" · "}
                <bdi>{department.name}</bdi>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <PencilIcon aria-hidden />
            {t("edit")}
          </Button>
          {/* You can't deactivate your own account. */}
          {isMe ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("actionsFor", { name: employee.name })}
                >
                  <EllipsisVerticalIcon aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {employee.status === "invited" ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      updateStore((current) => ({
                        ...current,
                        history: [...current.history, change(id, "inviteSent")],
                      }))
                      notify.success(
                        t("detail.inviteResent", { email: employee.email })
                      )
                    }}
                  >
                    <MailIcon aria-hidden />
                    {t("detail.resendInvite")}
                  </DropdownMenuItem>
                ) : null}
                {employee.status === "deactivated" ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setStatus("active", "reactivated")
                      notify.success(
                        t("detail.reactivated", { name: employee.name })
                      )
                    }}
                  >
                    <UserCheckIcon aria-hidden />
                    {t("detail.reactivate")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeactivating(true)}
                  >
                    <UserXIcon aria-hidden />
                    {t("detail.deactivate")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card aria-labelledby="details-title">
          <CardHeader>
            <CardTitle id="details-title">{t("detail.detailsTitle")}</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-body">
            {(
              [
                [
                  "email",
                  <bdi key="v" dir="ltr">
                    {employee.email}
                  </bdi>,
                ],
                ["code", employee.code || <NoData key="v" />],
                [
                  "department",
                  department ? (
                    <bdi key="v">{department.name}</bdi>
                  ) : (
                    <NoData key="v" />
                  ),
                ],
                [
                  "manager",
                  manager ? (
                    <Link
                      key="v"
                      href={`/employees/${manager.id}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      <bdi>{manager.name}</bdi>
                    </Link>
                  ) : (
                    <NoData key="v" />
                  ),
                ],
                ["role", t(`roles.${employee.role}`)],
                ["joinedOn", format.day(employee.joinedOn, "long")],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">
                  {t(`history.fields.${key}`)}
                </dt>
                <dd className="min-w-0 truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <BalancesCard
          employee={employee}
          entries={store.ledger.filter((entry) => entry.employeeId === id)}
        />
      </div>

      <HistoryCard
        history={store.history
          .filter((entry) => entry.employeeId === id)
          .reverse()}
      />

      <EmployeeDrawer
        key={editing ? "open" : "closed"}
        editing={editing ? employee : null}
        onClose={() => setEditing(false)}
      />
      {deactivating ? (
        <DeactivateDialog
          employee={employee}
          reports={directReports(employee, store.employees)}
          candidates={store.employees.filter(
            (item) => item.id !== id && item.status === "active"
          )}
          onClose={() => setDeactivating(false)}
        />
      ) : null}
    </div>
  )
}

/**
 * Type-to-confirm with the impact (patterns/destructive-confirm.md): pending requests and
 * future leave are cancelled; direct reports move to one new manager before it goes through.
 */
function DeactivateDialog({
  employee,
  reports,
  candidates,
  onClose,
}: {
  employee: Employee
  reports: Employee[]
  candidates: Employee[]
  onClose: () => void
}) {
  const t = useTranslations("employees.deactivate")
  const [newManager, setNewManager] = useState<string>()
  const newManagerName = candidates.find((c) => c.id === newManager)?.name

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      variant="type-to-confirm"
      title={t("title", { name: employee.name })}
      description={t("description")}
      cancelLabel={t("keep")}
      confirmLabel={t("confirm")}
      requireInput={{
        label: t("typeName", { name: employee.name }),
        match: employee.name,
        errorMessage: t("nameMismatch"),
      }}
      errorMessage={t("reassignFirst")}
      impact={
        <div className="flex flex-col gap-3">
          <ul className="flex list-disc flex-col gap-1 ps-5">
            <li>{t("pending", { count: employee.pendingRequests })}</li>
            <li>{t("upcoming", { count: employee.upcomingLeaveDays })}</li>
            <li>{t("reports", { count: reports.length })}</li>
          </ul>
          {reports.length ? (
            <div className="flex flex-col gap-1">
              <span id="reassign-label" className="font-semibold">
                {t("newManager", { count: reports.length })}
              </span>
              <Select value={newManager} onValueChange={setNewManager}>
                <SelectTrigger
                  size="sm"
                  aria-labelledby="reassign-label"
                  className="bg-card"
                >
                  <SelectValue placeholder={t("chooseManager")} />
                </SelectTrigger>
                <SelectContent>
                  {candidates
                    .filter((candidate) => !reports.includes(candidate))
                    .map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      }
      onConfirm={() => {
        // The button stays enabled; the section error explains what's missing.
        if (reports.length && !newManager) throw new Error("reassign")
        updateStore((current) => ({
          ...current,
          employees: current.employees.map((item) =>
            item.id === employee.id
              ? {
                  ...item,
                  status: "deactivated",
                  pendingRequests: 0,
                  upcomingLeaveDays: 0,
                }
              : reports.includes(item)
                ? { ...item, managerId: newManager! }
                : item
          ),
          history: [
            ...current.history,
            change(employee.id, "deactivated", [
              { field: "status", from: employee.status, to: "deactivated" },
            ]),
            ...reports.map((report) =>
              change(report.id, "updated", [
                { field: "manager", from: employee.name, to: newManagerName! },
              ])
            ),
          ],
        }))
        notify.success(t("done", { name: employee.name }))
      }}
    />
  )
}

function BalancesCard({
  employee,
  entries,
}: {
  employee: Employee
  entries: LedgerEntry[]
}) {
  const t = useTranslations("employees.balances")
  const [adjusting, setAdjusting] = useState<string | null>(null)

  return (
    <Card aria-labelledby="balances-title" className="min-w-0">
      <CardHeader>
        <CardTitle id="balances-title">{t("title")}</CardTitle>
        <CardDescription>{t("description", { year: YEAR })}</CardDescription>
      </CardHeader>
      <Tabs defaultValue={TRACKED[0]!.id}>
        <TabsList>
          {TRACKED.map((type) => (
            <TabsTrigger key={type.id} value={type.id}>
              <bdi>{type.name}</bdi>
            </TabsTrigger>
          ))}
        </TabsList>
        {TRACKED.map((type) => (
          <TabsContent
            key={type.id}
            value={type.id}
            className="flex flex-col gap-3"
          >
            <Ledger
              leaveTypeName={type.name}
              entries={entries.filter((entry) => entry.leaveTypeId === type.id)}
            />
            {employee.status === "deactivated" ? null : (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setAdjusting(type.id)}
              >
                <SlidersHorizontalIcon aria-hidden />
                {t("adjust")}
              </Button>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <AdjustDialog
        key={adjusting ?? "closed"}
        employee={employee}
        leaveTypeId={adjusting}
        available={
          ledgerRows(entries.filter((entry) => entry.leaveTypeId === adjusting))
            .available
        }
        onClose={() => setAdjusting(null)}
      />
    </Card>
  )
}

const ENTRY_TONE: Record<LedgerEntry["type"], (amount: number) => string> = {
  allowance: () => "text-success",
  adjustment: (amount) => (amount > 0 ? "text-success" : "text-foreground"),
  reservation: () => "text-status-pending",
  release: () => "text-success",
  deduction: () => "text-foreground",
  restoration: () => "text-success",
}

// docs/design-system/components/ledger-table.md
function Ledger({
  leaveTypeName,
  entries,
}: {
  leaveTypeName: string
  entries: LedgerEntry[]
}) {
  const t = useTranslations("employees.balances")
  const format = useFormat()
  const { rows, available } = ledgerRows(entries)
  const signed = (amount: number) =>
    `${amount > 0 ? "+" : "−"}${format.number(Math.abs(amount))}`

  if (rows.length === 0)
    return (
      <p className="py-6 text-center text-muted-foreground">{t("empty")}</p>
    )

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableCaption className="sr-only">
          {t("caption", { type: leaveTypeName, year: YEAR })}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.date")}</TableHead>
            <TableHead>{t("columns.type")}</TableHead>
            <TableHead>{t("columns.details")}</TableHead>
            <TableHead className="text-end">{t("columns.change")}</TableHead>
            <TableHead className="text-end">{t("columns.available")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry) => {
            const pending = entry.type === "reservation"
            const details = entry.reason
              ? `${entry.reason} · ${entry.actor}`
              : entry.details
            return (
              <TableRow key={entry.id}>
                <TableCell className="tabular whitespace-nowrap">
                  {format.day(entry.date, "numeric")}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {t(`types.${entry.type}`)}
                </TableCell>
                <TableCell className="max-w-48 truncate" title={details}>
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      className="underline underline-offset-4"
                    >
                      <bdi>{details}</bdi>
                    </Link>
                  ) : (
                    <bdi>{details}</bdi>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "tabular text-end font-semibold whitespace-nowrap",
                    ENTRY_TONE[entry.type](entry.amount)
                  )}
                >
                  <span aria-hidden>
                    {/* The sign comes first in both languages (ledger-table.md › RTL). */}
                    <bdi dir="ltr">{signed(entry.amount)}</bdi>
                    {pending ? ` ${t("pendingSuffix")}` : ""}
                  </span>
                  <span className="sr-only">
                    {t(entry.amount > 0 ? "plus" : "minus", {
                      amount: format.number(Math.abs(entry.amount)),
                    })}
                    {pending ? `, ${t("pending")}` : ""}
                  </span>
                </TableCell>
                <TableCell className="tabular text-end">
                  {format.number(entry.balanceAfter)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <tfoot>
          <TableRow className="border-t-[1.5px] border-border-strong">
            <TableCell colSpan={4} className="font-extrabold">
              {t("availableNow")}
            </TableCell>
            <TableCell className="tabular text-end font-extrabold">
              {format.number(available)}
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  )
}

const AdjustBody = z.object({
  amount: z
    .number({ error: "REQUIRED" })
    .int()
    .min(-365)
    .max(365)
    .refine((value) => value !== 0, { error: "ZERO_ADJUSTMENT" }),
  reason: z.string().trim().min(1).max(500),
})
type AdjustInput = z.input<typeof AdjustBody>

function AdjustDialog({
  employee,
  leaveTypeId,
  available,
  onClose,
}: {
  employee: Employee
  leaveTypeId: string | null
  available: number
  onClose: () => void
}) {
  const t = useTranslations("employees.balances")
  const tCommon = useTranslations("common")
  const format = useFormat()
  const type = TRACKED.find((item) => item.id === leaveTypeId)
  const form = useForm<AdjustInput>({
    resolver: zodResolver(AdjustBody, codeErrorMap),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { amount: 0, reason: "" },
  })
  const amount = useWatch({ control: form.control, name: "amount" }) ?? 0

  const onSubmit = form.handleSubmit(({ amount, reason }) => {
    if (!type) return
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      leaveTypeId: type.id,
      date: new Intl.DateTimeFormat("en-CA", {
        timeZone: DEMO_USER.company.timezone,
      }).format(new Date()) as LedgerEntry["date"],
      type: "adjustment",
      details: reason.trim(),
      amount,
      actor: DEMO_USER.name,
      reason: reason.trim(),
    }
    updateStore((current) => ({
      ...current,
      ledger: [...current.ledger, entry],
      history: [
        ...current.history,
        change(
          employee.id,
          "balanceAdjusted",
          [
            {
              field: type.name,
              from: String(available),
              to: String(available + amount),
            },
          ],
          reason.trim()
        ),
      ],
    }))
    notify.success(t("adjusted", { type: type.name, name: employee.name }))
    onClose()
  })

  return (
    <Dialog
      open={type !== undefined}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent size="sm" closeLabel={tCommon("close")}>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("adjustTitle", { type: type?.name ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {t("adjustDescription", { name: employee.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              {type ? (
                <p className="flex items-center gap-2 text-body-sm">
                  <LeaveIcon
                    icon={type.icon}
                    className="size-8 [&_svg]:size-4"
                  />
                  {t("preview", {
                    from: format.number(available),
                    to: format.number(available + (Number(amount) || 0)),
                  })}
                </p>
              ) : null}
              <StepperField
                form={form}
                name="amount"
                label={t("amount")}
                description={t("amountHint")}
                unit={t("days")}
                min={-365}
                max={365}
              />
              <ReasonField
                form={form}
                name="reason"
                label={t("reason")}
                description={t("reasonHint")}
              />
            </FieldGroup>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HistoryCard({ history }: { history: EmployeeChange[] }) {
  const t = useTranslations("employees.history")
  const tAll = useTranslations()
  const locale = useLocale() as Locale
  const dateTime = useMemo(
    () =>
      new Intl.DateTimeFormat(getIntlLocale(locale), {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: DEMO_USER.company.timezone,
      }),
    [locale]
  )
  const value = (field: string, raw: string) =>
    field === "role"
      ? tAll(`employees.roles.${raw as Employee["role"]}`)
      : field === "status"
        ? tAll(`account.${raw as Employee["status"]}`)
        : raw
  const fieldLabel = (field: string) =>
    t.has(`fields.${field}` as never) ? t(`fields.${field}` as never) : field

  return (
    <Card aria-labelledby="history-title">
      <CardHeader>
        <CardTitle id="history-title">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <ChangesTimeline
        label={t("title")}
        labels={{
          was: t("was"),
          now: t("now"),
          changedTo: t("changedTo"),
          showAll: (count) => t("showAll", { count }),
        }}
        events={history.map((entry) => ({
          id: entry.id,
          action: t(`actions.${entry.action}`),
          actor: entry.actor,
          at: dateTime.format(new Date(entry.at)),
          dateTime: entry.at,
          source: t(entry.action === "imported" ? "system" : "manual"),
          fields: entry.fields.map((field) => ({
            label: fieldLabel(field.field),
            from: value(field.field, field.from),
            to: value(field.field, field.to),
          })),
          reason: entry.reason,
        }))}
      />
    </Card>
  )
}
