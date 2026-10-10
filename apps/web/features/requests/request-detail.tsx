"use client"

import { ArrowLeftIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { ErrorPage } from "@/components/error-page"
import { Status, useStatusLabel } from "@/components/status"
import { companyDate } from "@/features/attendance/rules"
import { Link } from "@/i18n/navigation"
import { DEMO_USER } from "@/lib/demo-user"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { CategoryChip } from "@workspace/ui/components/category-chip"
import { ConfirmDialog } from "@workspace/ui/components/confirm-dialog"
import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"
import { notify } from "@workspace/ui/components/sonner"
import {
  StatusTimeline,
  type StatusEvent,
} from "@workspace/ui/components/timeline"

import type { MyRequest } from "./demo-data"
import { requestType, useRequestText } from "./request-text"
import { allowedActions, canView, type RequestAction } from "./rules"
import { act, today, useRequests } from "./store"

/** The shareable request page (/requests/:id), used by emails and notifications. */
export function RequestDetail({ id }: { id: string }) {
  const t = useTranslations("requests")
  const requests = useRequests()

  if (!requests) {
    return (
      <SkeletonGroup label={t("loading")} className="flex flex-col gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </SkeletonGroup>
    )
  }
  const request = requests.find((item) => item.id === id)
  if (!request) return <ErrorPage kind="notFound" inShell />
  // ponytail: the API answers 403 (BE-03); the demo decides here.
  if (!canView(request, DEMO_USER))
    return <ErrorPage kind="forbidden" inShell />
  return <RequestView request={request} />
}

function useWhen() {
  const format = useFormat()
  return (iso: string) =>
    `${format.day(companyDate(new Date(iso), DEMO_USER.company.timezone))} · ${format.time(iso)}`
}

function RequestView({ request }: { request: MyRequest }) {
  const t = useTranslations("requests")
  const text = useRequestText()
  const statusLabel = useStatusLabel()
  const when = useWhen()
  const meta = requestType(request.type)
  const actions = allowedActions(request, meta, DEMO_USER, today())
  const [confirming, setConfirming] = useState<RequestAction | null>(null)
  const typeName = text.typeLabel(request.type)
  const approver = request.approver ?? t("hr")
  const own = request.employeeId === DEMO_USER.id

  const events: StatusEvent[] = request.events.map((event) => ({
    id: event.id,
    kind: event.kind,
    title:
      event.kind === "submitted"
        ? t("timeline.submitted")
        : statusLabel(event.kind),
    actor: event.onBehalfOf
      ? t("timeline.byOnBehalf", {
          name: event.actor,
          employee: event.onBehalfOf,
        })
      : t("timeline.by", { name: event.actor }),
    at: when(event.at),
    dateTime: event.at,
    comment: event.comment,
  }))
  if (request.status === "pending" || request.status === "cancel-requested") {
    events.push({
      id: "next",
      kind: "next",
      title: t(
        request.status === "pending"
          ? "timeline.waiting"
          : "timeline.waitingCancellation",
        { approver }
      ),
    })
  }

  return (
    <div className="flex max-w-240 flex-col gap-6">
      <Link
        href="/requests"
        className="inline-flex w-fit items-center gap-1 text-body-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon aria-hidden className="flip-rtl size-4" />
        {t("title")}
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={meta?.category ?? ""} label={typeName} />
          <Status status={request.status} />
        </div>
        <h1 className="text-h2 font-bold">{text.title(request)}</h1>
        <p className="text-muted-foreground">
          {own ? (
            text.when(request)
          ) : (
            <>
              <bdi>{request.employeeName}</bdi> · {text.when(request)}
            </>
          )}
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card className="gap-0 py-0">
          <h2 className="border-b px-card py-4 text-body-lg font-bold">
            {t("detail.summary")}
          </h2>
          <dl className="grid gap-4 p-card sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <Row label={t("detail.employee")}>
              <bdi>{request.employeeName}</bdi>
            </Row>
            <Row label={t("detail.approver")}>
              <bdi>{approver}</bdi>
            </Row>
            {meta?.fields.map((field) => (
              <Row key={field.key} label={text.text(field.label)}>
                {text.value(field, request.values[field.key]) ? (
                  <bdi>{text.value(field, request.values[field.key])}</bdi>
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
                  variant={action === "adminCancel" ? "destructive" : "outline"}
                  onClick={() => setConfirming(action)}
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

      {(["withdraw", "requestCancellation", "adminCancel"] as const).map(
        (action) => (
          <ConfirmDialog
            key={action}
            open={confirming === action}
            onOpenChange={(open) => !open && setConfirming(null)}
            title={t(`actions.${action}.title`, {
              type: typeName,
              name: request.employeeName,
            })}
            description={t(`actions.${action}.description`, {
              when: text.when(request),
              approver,
              name: request.employeeName,
            })}
            confirmLabel={t(`actions.${action}.confirm`)}
            cancelLabel={t(`actions.${action}.keep`)}
            requireInput={
              action === "adminCancel"
                ? {
                    label: t("actions.adminCancel.reason"),
                    errorMessage: t("actions.adminCancel.reasonRequired"),
                  }
                : undefined
            }
            errorMessage={t("actions.failed")}
            onConfirm={async (reason) => {
              await act(request.id, action, reason?.trim() || undefined)
              notify.success(t(`actions.${action}.done`))
            }}
          />
        )
      )}
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
      <dd className="-mt-3 text-body break-words sm:mt-0">{children}</dd>
    </>
  )
}
