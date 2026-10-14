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
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { ReasonField, StepperField } from "@/components/form-fields"
import { DateField } from "@/components/pickers"
import { Status } from "@/components/status"
import { useUser } from "@/components/user-provider"
import { companyDate } from "@/features/attendance/rules"
import { useRequestTypeLabel } from "@/features/requests/request-text"
import { useCalendarNames } from "@/features/settings/company-settings"
import { Link } from "@/i18n/navigation"
import { codeErrorMap, showProblem } from "@/lib/forms"
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
import type { PlainDate } from "@workspace/ui/components/date-picker"
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

import {
  adjustBalance,
  deactivate,
  previewDeactivation,
  reactivate,
  resendInvite,
  type DeactivationImpact,
} from "./actions"
import type {
  Balance,
  Department,
  Employee,
  EmployeeChange,
  LedgerEntry,
  PersonOption,
} from "./employee-data"
import { EmployeeDrawer } from "./employee-drawer"
import { NoData } from "./employees-list"
import { ledgerRows } from "./rules"

export function EmployeeDetail({
  employee,
  balances,
  ledgers,
  history,
  departments,
  managers,
}: {
  employee: Employee
  balances: Balance[]
  /** Each tracked type's ledger, by leave type id. */
  ledgers: Record<string, LedgerEntry[]>
  history: EmployeeChange[]
  departments: Department[]
  managers: PersonOption[]
}) {
  const t = useTranslations("employees")
  const format = useFormat()
  const me = useUser()
  const [editing, setEditing] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const isMe = employee.id === me.id

  async function run(action: Promise<unknown>, done: string) {
    if (await action) notify.error(t("detail.failed"))
    else notify.success(done)
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
        <PersonAvatar
          name={employee.name}
          userId={employee.id}
          src={employee.photoUrl ?? undefined}
          size={56}
        />
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h2 font-bold">
              <bdi>{employee.name}</bdi>
            </h1>
            <Status status={employee.status} />
          </div>
          <p className="text-muted-foreground">
            <bdi>{employee.jobTitle}</bdi>
            {employee.department ? (
              <>
                {employee.jobTitle ? " · " : null}
                <bdi>{employee.department.name}</bdi>
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
                    onSelect={() =>
                      void run(
                        resendInvite(employee.id),
                        t("detail.inviteResent", { email: employee.email })
                      )
                    }
                  >
                    <MailIcon aria-hidden />
                    {t("detail.resendInvite")}
                  </DropdownMenuItem>
                ) : null}
                {employee.status === "deactivated" ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      void run(
                        reactivate(employee.id),
                        t("detail.reactivated", { name: employee.name })
                      )
                    }
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
                ["employeeCode", employee.code || <NoData key="v" />],
                [
                  "departmentId",
                  employee.department ? (
                    <bdi key="v">{employee.department.name}</bdi>
                  ) : (
                    <NoData key="v" />
                  ),
                ],
                [
                  "managerId",
                  employee.manager ? (
                    <Link
                      key="v"
                      href={`/employees/${employee.manager.id}`}
                      className="font-semibold underline underline-offset-4"
                    >
                      <bdi>{employee.manager.name}</bdi>
                    </Link>
                  ) : (
                    <NoData key="v" />
                  ),
                ],
                ["role", t(`roles.${employee.role}`)],
                [
                  "joiningDate",
                  employee.joinedOn ? (
                    format.day(employee.joinedOn, "long")
                  ) : (
                    <NoData key="v" />
                  ),
                ],
                ...(employee.lastWorkingDay
                  ? ([
                      [
                        "lastWorkingDay",
                        format.day(employee.lastWorkingDay, "long"),
                      ],
                    ] as const)
                  : []),
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
          balances={balances.filter((balance) => balance.tracked)}
          ledgers={ledgers}
        />
      </div>

      <HistoryCard
        history={history}
        departments={departments}
        managers={managers}
      />

      <EmployeeDrawer
        key={editing ? "open" : "closed"}
        editing={editing ? employee : null}
        departments={departments}
        managers={managers}
        onClose={() => setEditing(false)}
      />
      {deactivating ? (
        <DeactivateDialog
          employee={employee}
          candidates={managers.filter((item) => item.id !== employee.id)}
          onClose={() => setDeactivating(false)}
        />
      ) : null}
    </div>
  )
}

/**
 * Type-to-confirm with the impact (patterns/destructive-confirm.md). The server previews what the
 * chosen last working day does; direct reports move to one new manager before it goes through.
 */
function DeactivateDialog({
  employee,
  candidates,
  onClose,
}: {
  employee: Employee
  candidates: PersonOption[]
  onClose: () => void
}) {
  const t = useTranslations("employees.deactivate")
  const typeLabel = useRequestTypeLabel()
  const { timezone } = useUser().company
  const [lastDay, setLastDay] = useState<PlainDate>(() =>
    companyDate(new Date(), timezone)
  )
  const [impact, setImpact] = useState<DeactivationImpact | null>(null)
  const [newManager, setNewManager] = useState<string>()

  useEffect(() => {
    let current = true
    void previewDeactivation(employee.id, lastDay).then((result) => {
      if (current) setImpact(result.impact ?? null)
    })
    return () => {
      current = false
    }
  }, [employee.id, lastDay])

  const reports = impact?.directReports ?? []
  const reportIds = new Set(reports.map((report) => report.id))
  const types = (items: { type: string }[]) =>
    [...new Set(items.map((item) => typeLabel(item.type)))].join(", ")

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
          <DateField
            label={t("lastDay")}
            description={t("lastDayHint")}
            value={lastDay}
            onChange={(value) => value && setLastDay(value)}
          />
          {impact ? (
            <ul className="flex list-disc flex-col gap-1 ps-5">
              <li>
                {t("pending", { count: impact.pendingRequests.length })}
                {impact.pendingRequests.length
                  ? ` (${types(impact.pendingRequests)})`
                  : null}
              </li>
              <li>
                {t("upcoming", { count: impact.futureApprovedTimeOff.length })}
              </li>
              <li>{t("reports", { count: reports.length })}</li>
            </ul>
          ) : (
            <p className="text-muted-foreground">{t("checking")}</p>
          )}
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
                    .filter((candidate) => !reportIds.has(candidate.id))
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
      onConfirm={async () => {
        // The button stays enabled; the section error explains what's missing.
        if (!impact || (reports.length && !newManager))
          throw new Error("reassign")
        const problem = await deactivate(employee.id, {
          lastWorkingDay: lastDay,
          ...(reports.length && { reassignReportsTo: newManager }),
        })
        if (problem) {
          notify.error(t("failed"))
          throw new Error(problem.code)
        }
        notify.success(t("done", { name: employee.name }))
      }}
    />
  )
}

function BalancesCard({
  employee,
  balances,
  ledgers,
}: {
  employee: Employee
  balances: Balance[]
  ledgers: Record<string, LedgerEntry[]>
}) {
  const t = useTranslations("employees.balances")
  const [adjusting, setAdjusting] = useState<Balance | null>(null)
  const year = balances[0]?.year

  return (
    <Card aria-labelledby="balances-title" className="min-w-0">
      <CardHeader>
        <CardTitle id="balances-title">{t("title")}</CardTitle>
        <CardDescription>
          {t("description", { year: year ?? "" })}
        </CardDescription>
      </CardHeader>
      {balances.length ? (
        <Tabs defaultValue={balances[0]!.leaveType.id}>
          <TabsList>
            {balances.map((balance) => (
              <TabsTrigger
                key={balance.leaveType.id}
                value={balance.leaveType.id}
              >
                <bdi>{balance.leaveType.name}</bdi>
              </TabsTrigger>
            ))}
          </TabsList>
          {balances.map((balance) => (
            <TabsContent
              key={balance.leaveType.id}
              value={balance.leaveType.id}
              className="flex flex-col gap-3"
            >
              <Ledger
                leaveTypeName={balance.leaveType.name}
                year={balance.year}
                entries={ledgers[balance.leaveType.id] ?? []}
              />
              {employee.status === "deactivated" ? null : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setAdjusting(balance)}
                >
                  <SlidersHorizontalIcon aria-hidden />
                  {t("adjust")}
                </Button>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <p className="py-6 text-center text-muted-foreground">{t("empty")}</p>
      )}
      <AdjustDialog
        key={adjusting?.leaveType.id ?? "closed"}
        employee={employee}
        balance={adjusting}
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
  year,
  entries,
}: {
  leaveTypeName: string
  year: number
  entries: LedgerEntry[]
}) {
  const t = useTranslations("employees.balances")
  const format = useFormat()
  const { timezone } = useUser().company
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
          {t("caption", { type: leaveTypeName, year })}
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
              ? [entry.reason, entry.actor].filter(Boolean).join(" · ")
              : entry.requestId
                ? t("fromRequest")
                : ""
            return (
              <TableRow key={entry.id}>
                <TableCell className="tabular whitespace-nowrap">
                  {format.day(
                    companyDate(new Date(entry.at), timezone),
                    "numeric"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {t(`types.${entry.type}`)}
                </TableCell>
                <TableCell className="max-w-48 truncate" title={details}>
                  {entry.requestId ? (
                    <Link
                      href={`/requests/${entry.requestId}`}
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
    .multipleOf(0.5)
    .min(-365)
    .max(365)
    .refine((value) => value !== 0, { error: "ZERO_ADJUSTMENT" }),
  reason: z.string().trim().min(1).max(500),
})
type AdjustInput = z.input<typeof AdjustBody>

function AdjustDialog({
  employee,
  balance,
  onClose,
}: {
  employee: Employee
  balance: Balance | null
  onClose: () => void
}) {
  const t = useTranslations("employees.balances")
  const tCommon = useTranslations("common")
  const format = useFormat()
  const form = useForm<AdjustInput>({
    resolver: zodResolver(AdjustBody, codeErrorMap),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { amount: 0, reason: "" },
  })
  const amount = useWatch({ control: form.control, name: "amount" }) ?? 0
  const available = balance?.available ?? 0

  const onSubmit = form.handleSubmit(async ({ amount, reason }) => {
    if (!balance) return
    const problem = await adjustBalance(employee.id, balance.leaveType.id, {
      days: amount,
      reason: reason.trim(),
    })
    if (problem) {
      showProblem(form, problem, { days: "amount" })
      if (form.formState.errors.root) notify.error(t("failed"))
      return
    }
    notify.success(
      t("adjusted", { type: balance.leaveType.name, name: employee.name })
    )
    onClose()
  })

  return (
    <Dialog open={balance !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" closeLabel={tCommon("close")}>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("adjustTitle", { type: balance?.leaveType.name ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {t("adjustDescription", { name: employee.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup>
              {balance ? (
                <p className="flex items-center gap-2 text-body-sm">
                  <LeaveIcon
                    icon={balance.leaveType.icon}
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
            <Button type="submit" loading={form.formState.isSubmitting}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HistoryCard({
  history,
  departments,
  managers,
}: {
  history: EmployeeChange[]
  departments: Department[]
  managers: PersonOption[]
}) {
  const t = useTranslations("employees.history")
  const tAll = useTranslations()
  const format = useFormat()
  const names = useCalendarNames()
  const known = (key: string) => t.has(key as never)

  const value = (field: string, raw: unknown) => {
    if (raw === null || raw === undefined || raw === "") return "—"
    const text = String(raw)
    if (field === "role")
      return tAll(`employees.roles.${text.toLowerCase()}` as never)
    if (field === "status")
      return tAll(`account.${text.toLowerCase()}` as never)
    if (field === "departmentId")
      return departments.find((item) => item.id === text)?.name ?? "—"
    if (field === "managerId")
      return managers.find((item) => item.id === text)?.name ?? "—"
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return format.day(text as PlainDate)
    if (typeof raw === "boolean") return tAll(raw ? "common.yes" : "common.no")
    return text
  }

  return (
    <Card aria-labelledby="history-title">
      <CardHeader>
        <CardTitle id="history-title">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      {history.length ? (
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
            // Dynamic keys: an unknown action or field shows as the API sent it.
            action: known(`actions.${entry.action}`)
              ? t(`actions.${entry.action}` as never)
              : entry.action,
            actor: entry.actor ?? t("system"),
            at: names.dateTime.format(new Date(entry.at)),
            dateTime: entry.at,
            source: t(entry.actor ? "manual" : "system"),
            fields: entry.fields
              .filter((field) => field.field !== "photoFileId")
              .map((field) => ({
                label: known(`fields.${field.field}`)
                  ? t(`fields.${field.field}` as never)
                  : field.field,
                from: value(field.field, field.from),
                to: value(field.field, field.to),
              })),
            reason: entry.reason ?? undefined,
          }))}
        />
      ) : (
        <p className="text-body text-muted-foreground">{t("empty")}</p>
      )}
    </Card>
  )
}
