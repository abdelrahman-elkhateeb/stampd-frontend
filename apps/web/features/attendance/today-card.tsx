"use client"

import {
  ArrowRightIcon,
  InfoIcon,
  LogInIcon,
  LogOutIcon,
  TriangleAlertIcon,
  WifiOffIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useSyncExternalStore } from "react"

import { Status } from "@/components/status"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/lib/use-format"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton, SkeletonGroup } from "@workspace/ui/components/skeleton"
import { notify } from "@workspace/ui/components/sonner"

import { companyToday, demoRules, type Session } from "./demo-data"
import {
  clockMinutes,
  dayStatus,
  missedCheckout,
  openSession,
  todayWarning,
  workedMinutes,
} from "./rules"
import { checkInNow, checkOutNow, useAttendanceRecords, useNow } from "./store"

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener)
  window.addEventListener("offline", listener)
  return () => {
    window.removeEventListener("online", listener)
    window.removeEventListener("offline", listener)
  }
}

/** docs/design-system/components/today-card.md · shared with the dashboard (FE-09). */
export function TodayCard() {
  const t = useTranslations("attendance.today")
  const tAll = useTranslations()
  const format = useFormat()
  const records = useAttendanceRecords()
  const now = useNow()
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  )
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [announcement, setAnnouncement] = useState("")

  if (!records || now === null) {
    return (
      <SkeletonGroup
        label={t("loading")}
        className="flex flex-col gap-4 rounded-lg border p-card"
      >
        <Skeleton className="h-chip w-40 rounded-pill" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-14 w-full rounded-pill" />
      </SkeletonGroup>
    )
  }

  const rules = demoRules(companyToday(now))
  const record = records.find((item) => item.date === rules.today)
  const sessions = record?.sessions ?? []
  const open = openSession(record)
  const status = dayStatus(rules.today, record, rules) ?? "not-yet"
  const worked = workedMinutes(sessions, now)
  const warning = todayWarning(record, rules)
  const missed = missedCheckout(records, rules)
  const shift = clockMinutes(rules.workEnd) - clockMinutes(rules.workStart)
  const progress = Math.min(100, Math.round((worked / shift) * 100))
  const graceEnd = clockMinutes(rules.workStart) + rules.graceMinutes
  const graceEndLabel = `${String(Math.floor(graceEnd / 60)).padStart(2, "0")}:${String(graceEnd % 60).padStart(2, "0")}`

  async function act() {
    setBusy(true)
    setFailed(false)
    try {
      if (open) {
        const time = format.time(await checkOutNow())
        notify.success(t("checkedOutToast", { time }))
        setAnnouncement(t("checkedOutToast", { time }))
      } else {
        const at = await checkInNow()
        const after = dayStatus(
          rules.today,
          { date: rules.today, sessions: [...sessions, { in: at }] },
          rules
        )
        notify.success(t("checkedInToast", { time: format.time(at) }))
        setAnnouncement(
          t("checkedInAnnouncement", {
            status: after === "late" ? "late" : "present",
          })
        )
      }
    } catch {
      setFailed(true)
      notify.error(t("error"), {
        label: tAll("common.tryAgain"),
        onClick: () => void act(),
      })
    } finally {
      setBusy(false)
    }
  }

  const label = !online
    ? t(open ? "checkOutOffline" : "checkInOffline")
    : open
      ? t("checkOut")
      : sessions.length
        ? t("checkInAgain")
        : warning
          ? t("checkInAnyway")
          : t("checkIn")

  return (
    <Card
      variant={sessions.length && !open ? "default" : "hero"}
      aria-labelledby="today-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="today-title" className="text-h4 font-bold">
          {t("title", { date: format.day(rules.today) })}
        </h2>
        <Status status={status} size="sm" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-semibold text-muted-foreground">
          {sessions.length ? t("worked") : t("now")}
        </p>
        <p
          aria-live="off"
          tabIndex={0}
          aria-label={
            sessions.length
              ? t("workedLabel", { duration: format.duration(worked) })
              : undefined
          }
          className="tabular w-fit rounded-sm text-numeric font-black outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {sessions.length ? (
            format.duration(worked)
          ) : (
            <bdi dir="ltr">{format.time(new Date(now).toISOString())}</bdi>
          )}
        </p>
        <p className="text-body-sm text-muted-foreground">
          {t("shift", {
            start: rules.workStart,
            end: rules.workEnd,
            grace: graceEndLabel,
          })}
        </p>
      </div>

      {open ? (
        <div
          role="progressbar"
          aria-label={t("progressLabel")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={t("progress", { percent: progress })}
          className="h-2 overflow-hidden rounded-pill bg-muted"
        >
          <div
            className="h-full rounded-pill bg-status-present"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {sessions.length ? (
        <SessionList sessions={sessions} now={now} label={t("sessions")} />
      ) : null}

      {warning ? (
        <p className="flex gap-2 rounded-md bg-info-bg px-3 py-2 text-body-sm text-info">
          <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t(`warning.${warning}`)}
        </p>
      ) : null}
      {missed ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-warning-bg px-3 py-2 text-body-sm text-warning">
          <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
          <span className="flex-1">
            {t("missed", { date: format.day(missed) })}
          </span>
          <Link
            href={`/requests/new?type=correction&date=${missed}`}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
          >
            {t("requestCorrection")}
            <ArrowRightIcon aria-hidden className="flip-rtl size-3.5" />
          </Link>
        </div>
      ) : null}
      {!online ? (
        <p className="flex gap-2 text-body-sm text-muted-foreground">
          <WifiOffIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("offline")}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          variant={sessions.length && !open ? "outline" : "brand"}
          size={sessions.length && !open ? "default" : "hero"}
          className="w-full sm:w-fit sm:min-w-56"
          leadingIcon={open ? LogOutIcon : LogInIcon}
          loading={busy}
          loadingLabel={t(open ? "checkingOut" : "checkingIn")}
          onClick={act}
          aria-describedby={failed ? "today-error" : undefined}
        >
          {label}
        </Button>
        {failed ? (
          <p id="today-error" role="alert" className="text-body-sm text-error">
            {t("error")}
          </p>
        ) : null}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </Card>
  )
}

/** In → out and the time worked, one row per session. */
export function SessionList({
  sessions,
  now,
  label,
}: {
  sessions: Session[]
  /** null for a past day: an open session there is a missing check-out. */
  now: number | null
  label: string
}) {
  const t = useTranslations("attendance.today")
  const format = useFormat()
  return (
    <ul aria-label={label} className="flex flex-col divide-y rounded-md border">
      {sessions.map((session) => (
        <li
          key={session.in}
          className="flex items-center justify-between gap-3 px-3 py-2 text-body"
        >
          <span className="tabular flex items-center gap-2">
            <bdi dir="ltr">{format.time(session.in)}</bdi>
            <ArrowRightIcon
              aria-label={t("to")}
              className="flip-rtl size-3.5 text-muted-foreground"
            />
            {session.out ? (
              <bdi dir="ltr">{format.time(session.out)}</bdi>
            ) : (
              <span className="font-semibold">
                {now === null ? t("noCheckout") : t("ongoing")}
              </span>
            )}
          </span>
          {session.out || now !== null ? (
            <span className="tabular text-muted-foreground">
              {format.duration(workedMinutes([session], now))}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
