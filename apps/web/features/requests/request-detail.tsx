"use client"

import { ArrowLeftIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Status, useStatusLabel } from "@/components/status"
import { useUser } from "@/components/user-provider"
import { companyDate } from "@/features/attendance/rules"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { CategoryChip } from "@workspace/ui/components/category-chip"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { notify } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  StatusTimeline,
  type StatusEvent,
} from "@workspace/ui/components/timeline"

import {
  acceptCancellation,
  approveRequest,
  cancelRequest,
  declineCancellation,
  rejectRequest,
  requestCancellation,
  withdrawRequest,
} from "./actions"
import type {
  LeaveTypeName,
  RequestDetail as Detail,
  RequestType,
} from "./request-data"
import { categoryOf, useRequestText } from "./request-text"

/** What the API says the viewer may do (`actions`), in button order. */
const ACTIONS = {
  WITHDRAW: "withdraw",
  REQUEST_CANCELLATION: "requestCancellation",
  CANCEL: "adminCancel",
  REJECT: "reject",
  APPROVE: "approve",
  DECLINE_CANCELLATION: "declineCancellation",
  APPROVE_CANCELLATION: "acceptCancellation",
} as const
type Action = (typeof ACTIONS)[keyof typeof ACTIONS]

const RUN = {
  withdraw: withdrawRequest,
  requestCancellation,
  adminCancel: cancelRequest,
  reject: rejectRequest,
  approve: approveRequest,
  declineCancellation,
  acceptCancellation,
}

/** Approving is one click with no confirm (approve-reject.md). ponytail: commits at once, no Undo window or comment; add when approvers ask. */
const DIRECT: Action[] = ["approve", "acceptCancellation"]
/** These need a reason. */
const REASONED: Action[] = ["adminCancel", "reject", "declineCancellation"]

/** Someone acted first, or the request started meanwhile. */
const STALE = ["REQUEST_STATUS_CONFLICT", "REQUEST_STARTED"]

/** The shareable request page (/requests/:id), used by emails and notifications. */
export function RequestDetail({
  request,
  types,
  leaveTypes,
  back = { href: "/requests" },
}: {
  request: Detail
  types: RequestType[]
  leaveTypes: LeaveTypeName[]
  /** Approvals shows it beside its list. */
  back?: { href: string; label?: string }
}) {
  const t = useTranslations("requests")
  const text = useRequestText({ types, leaveTypes })
  const statusLabel = useStatusLabel()
  const format = useFormat()
  const user = useUser()
  const [confirming, setConfirming] = useState<Action | null>(null)
  const [running, setRunning] = useState<Action | null>(null)
  const meta = types.find((type) => type.key === request.type)
  // In ACTIONS order, so Approve ends up at inline-end (approve-reject.md).
  const actions = Object.entries(ACTIONS).flatMap(([key, action]) =>
    request.actions.includes(key) ? [action] : []
  )
  const typeName = text.typeLabel(request.type)
  const name = request.requester.name ?? ""
  const own = request.requester.id === user.id
  const hr = request.approverPolicy === "ADMIN_ONLY"
  const approver = request.decision?.by.name ?? t(hr ? "hr" : "detail.manager")
  const waitingFor = t(hr ? "hr" : "theManager")
  async function run(action: Action, reason?: string) {
    const problem = await RUN[action](request.id, reason)
    // Someone acted first: the refreshed page shows where it stands.
    if (problem && STALE.includes(problem.code)) {
      setConfirming(null)
      notify.error(t("actions.conflict"))
      return
    }
    if (problem) throw new Error(problem.code)
    notify.success(t(`actions.${action}.done`, { name }))
  }

  const when = (iso: string) =>
    `${format.day(companyDate(new Date(iso), user.company.timezone))} · ${format.time(iso)}`

  const events: StatusEvent[] = request.timeline.flatMap((entry, index) => {
    if (!entry.status) return []
    const submitted = entry.previousStatus === null
    const actor =
      entry.actor.type === "SYSTEM"
        ? t("timeline.bySystem")
        : t("timeline.by", { name: entry.actor.name ?? "" })
    return [
      {
        id: String(index),
        kind: submitted ? "submitted" : entry.status,
        title: submitted ? t("timeline.submitted") : statusLabel(entry.status),
        actor:
          submitted && request.createdBy.id !== request.requester.id
            ? t("timeline.byOnBehalf", {
                name: request.createdBy.name ?? "",
                employee: name,
              })
            : actor,
        at: when(entry.at),
        dateTime: entry.at,
        comment: entry.reason ?? undefined,
      },
    ]
  })
  if (request.status === "pending" || request.status === "cancel-requested") {
    events.push({
      id: "next",
      kind: "next",
      title: t(
        request.status === "pending"
          ? "timeline.waiting"
          : "timeline.waitingCancellation",
        { approver: waitingFor }
      ),
    })
  }

  const rows: [string, string | null][] = [
    [t("detail.employee"), name],
    [t("detail.approver"), approver],
    [
      text.fieldLabel(meta?.dates === "SINGLE_DAY" ? "day" : "dates"),
      text.days(request),
    ],
    ...(meta?.fields ?? []).map((field): [string, string | null] => [
      text.fieldLabel(field.name),
      text.value(field, request.data[field.name]),
    ]),
    [text.fieldLabel("reason"), request.reason],
  ]
  const time = text.times(request)
  if (time) rows.splice(3, 0, [text.fieldLabel("time"), time])

  return (
    <div className="@container flex max-w-240 flex-col gap-6">
      <Link
        href={back.href}
        className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="flip-rtl size-4" />
        {back.label ?? t("title")}
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={categoryOf(request.type)} label={typeName} />
          <Status status={request.status} />
        </div>
        <h1 className="text-h2 font-bold">{text.title(request)}</h1>
        <p className="text-muted-foreground">
          {own ? (
            text.when(request)
          ) : (
            <>
              <bdi>{name}</bdi> · {text.when(request)}
            </>
          )}
        </p>
      </div>

      <div className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card className="gap-0 py-0">
          <h2 className="border-b px-card py-4 text-body-lg font-bold">
            {t("detail.summary")}
          </h2>
          <dl className="grid gap-4 p-card @md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            {rows.map(([label, value]) => (
              <Row key={label} label={label}>
                {value ? (
                  <bdi>{value}</bdi>
                ) : (
                  <>
                    <span aria-hidden>–</span>
                    <span className="sr-only">{t("detail.none")}</span>
                  </>
                )}
              </Row>
            ))}
          </dl>
          {actions.length ? (
            <div className="flex flex-col gap-2 border-t p-card sm:flex-row sm:flex-wrap">
              {actions.map((action) => (
                <Button
                  key={action}
                  variant={
                    action === "adminCancel"
                      ? "destructive"
                      : DIRECT.includes(action)
                        ? "default"
                        : "outline"
                  }
                  className={cn(
                    DIRECT.includes(action) && "sm:ms-auto",
                    (action === "reject" || action === "declineCancellation") &&
                      "text-destructive"
                  )}
                  loading={running === action}
                  onClick={() => {
                    if (!DIRECT.includes(action)) return setConfirming(action)
                    setRunning(action)
                    run(action)
                      .catch(() => notify.error(t("actions.failed")))
                      .finally(() => setRunning(null))
                  }}
                >
                  {t(`actions.${action}.button`)}
                </Button>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="gap-0 py-0">
          <h2 className="border-b px-card py-4 text-body-lg font-bold">
            {t("detail.history")}
          </h2>
          <div className="p-card">
            <StatusTimeline
              label={t("detail.history")}
              events={events}
              labels={{
                nextStep: t("timeline.nextStep"),
                showAll: (count) => t("timeline.showAll", { count }),
              }}
            />
          </div>
        </Card>
      </div>

      {actions
        .filter((action) => !DIRECT.includes(action))
        .map((action) => (
          <ConfirmDialog
            key={action}
            open={confirming === action}
            onOpenChange={(open) => !open && setConfirming(null)}
            title={t(`actions.${action}.title`, { type: typeName, name })}
            description={t(`actions.${action}.description`, {
              when: text.when(request),
              // Only on your own requests, at the start of a sentence.
              approver: t(hr ? "hr" : "yourManager"),
              name,
            })}
            confirmLabel={t(`actions.${action}.confirm`)}
            cancelLabel={t(`actions.${action}.keep`)}
            requireInput={
              REASONED.includes(action)
                ? {
                    label: t("actions.reason"),
                    errorMessage: t("actions.reasonRequired", { name }),
                  }
                : undefined
            }
            errorMessage={t("actions.failed")}
            onConfirm={(reason) => run(action, reason)}
          />
        ))}
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="text-body-sm text-muted-foreground">{label}</dt>
      <dd className="-mt-3 text-body break-words @md:mt-0">{children}</dd>
    </>
  )
}
