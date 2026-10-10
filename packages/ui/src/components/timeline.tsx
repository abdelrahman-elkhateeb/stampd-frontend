"use client"

import * as React from "react"
import { ArrowRightIcon, ClockIcon, SendIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  statusMeta,
  type RequestStatus,
} from "@workspace/ui/components/status-chip"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/timeline.md · hand-written: shadcn has no timeline.
// Two variants: StatusTimeline (oldest first) and ChangesTimeline (newest first).

type StatusEventKind = RequestStatus | "submitted" | "next"

type StatusEvent = {
  id: string
  kind: StatusEventKind
  /** The status word, translated ("Approved", "Waiting for HR"). */
  title: string
  /** "by Khalid Al-Harbi", already translated; omitted for "next". */
  actor?: string
  /** Already formatted, in company time. */
  at?: string
  dateTime?: string
  comment?: string
}

type StatusTimelineProps = {
  /** "Request history". */
  label: string
  events: StatusEvent[]
  labels: { nextStep: string; showAll: (n: number) => string }
  collapseAfter?: number
}

function markerFor(kind: StatusEventKind) {
  if (kind === "next") return { icon: ClockIcon, tone: "", flip: false }
  if (kind === "submitted")
    return { icon: SendIcon, tone: "bg-info-bg text-info", flip: true }
  return statusMeta(kind)
}

function StatusTimeline({
  label,
  events,
  labels,
  collapseAfter = 10,
}: StatusTimelineProps) {
  const [expanded, setExpanded] = React.useState(false)
  // Oldest first, so "the latest 5" are the last five.
  const shown =
    expanded || events.length <= collapseAfter ? events : events.slice(-5)

  return (
    <div className="flex flex-col gap-3">
      {shown.length < events.length ? (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setExpanded(true)}
        >
          {labels.showAll(events.length)}
        </Button>
      ) : null}
      <ol aria-label={label} className="flex flex-col">
        {shown.map((event, index) => {
          const marker = markerFor(event.kind)
          const Icon = marker.icon
          const beforeNext = shown[index + 1]?.kind === "next"
          return (
            <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
              {index < shown.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute start-[13px] top-7 bottom-0 border-s-2 border-border",
                    beforeNext && "border-dashed"
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "relative flex size-7 shrink-0 items-center justify-center rounded-pill",
                  event.kind === "next"
                    ? "border-[1.5px] border-dashed border-border-strong bg-card text-muted-foreground"
                    : marker.tone
                )}
              >
                <Icon className={cn("size-4", marker.flip && "flip-rtl")} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                {event.kind === "next" ? (
                  <p className="label-overline">{labels.nextStep}</p>
                ) : null}
                <p className="text-body">
                  <span className="font-bold">{event.title}</span>
                  {event.actor ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · <bdi>{event.actor}</bdi>
                    </span>
                  ) : null}
                </p>
                {event.at ? (
                  <time
                    dateTime={event.dateTime}
                    className="text-caption text-muted-foreground"
                  >
                    {event.at}
                  </time>
                ) : null}
                {event.comment ? (
                  <p
                    dir="auto"
                    className="mt-1 rounded-md bg-muted px-3 py-2 text-body-sm"
                  >
                    {event.comment}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type ChangeEvent = {
  id: string
  action: string
  actor: string
  /** Already formatted, in company time. */
  at: string
  dateTime: string
  /** "Manual", "System", … */
  source: string
  fields: { label: string; from: string; to: string }[]
  reason?: string
}

type ChangesTimelineProps = {
  label: string
  events: ChangeEvent[]
  labels: {
    was: string
    now: string
    changedTo: string
    showAll: (n: number) => string
  }
  collapseAfter?: number
}

function ChangesTimeline({
  label,
  events,
  labels,
  collapseAfter = 10,
}: ChangesTimelineProps) {
  const [expanded, setExpanded] = React.useState(false)
  const shown =
    expanded || events.length <= collapseAfter ? events : events.slice(0, 5)

  return (
    <div className="flex flex-col gap-3">
      <ol aria-label={label} className="flex flex-col">
        {shown.map((event) => (
          <li
            key={event.id}
            className="relative flex flex-col gap-2 border-s-2 border-border ps-4 pb-5 last:border-transparent last:pb-0"
          >
            <span
              aria-hidden
              className="absolute -start-[7px] top-1 size-3 rounded-pill border-2 border-border-strong bg-card"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-body">
                <span className="font-bold">{event.action}</span>{" "}
                <span className="text-muted-foreground">
                  · <bdi>{event.actor}</bdi>
                </span>
              </p>
              <Badge>{event.source}</Badge>
            </div>
            <ul className="flex flex-col gap-1 text-body-sm">
              {event.fields.map((field) => (
                <li
                  key={field.label}
                  className="flex flex-wrap items-center gap-x-2"
                >
                  <span className="text-muted-foreground">{field.label}</span>
                  <del className="text-muted-foreground">
                    <span className="sr-only">{labels.was} </span>
                    <bdi>{field.from}</bdi>
                  </del>
                  <ArrowRightIcon aria-hidden className="flip-rtl size-3.5" />
                  <span className="sr-only">{labels.changedTo}</span>
                  <ins className="font-bold no-underline">
                    <span className="sr-only">{labels.now} </span>
                    <bdi>{field.to}</bdi>
                  </ins>
                </li>
              ))}
            </ul>
            {event.reason ? (
              <p className="rounded-md bg-muted px-3 py-2 text-body-sm">
                {event.reason}
              </p>
            ) : null}
            <time
              dateTime={event.dateTime}
              className="text-caption text-muted-foreground"
            >
              {event.at}
            </time>
          </li>
        ))}
      </ol>
      {shown.length < events.length ? (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setExpanded(true)}
        >
          {labels.showAll(events.length)}
        </Button>
      ) : null}
    </div>
  )
}

export {
  ChangesTimeline,
  StatusTimeline,
  type ChangeEvent,
  type ChangesTimelineProps,
  type StatusEvent,
  type StatusEventKind,
  type StatusTimelineProps,
}
