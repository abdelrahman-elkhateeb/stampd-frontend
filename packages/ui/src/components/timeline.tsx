"use client"

import * as React from "react"
import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

// docs/design-system/components/timeline.md · hand-written: shadcn has no timeline.
// ponytail: only the "changes" variant (newest first); the "status" variant arrives with FE-08.

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

export { ChangesTimeline, type ChangeEvent, type ChangesTimelineProps }
