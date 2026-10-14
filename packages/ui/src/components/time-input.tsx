"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ClockIcon } from "lucide-react"

import { inputClassName } from "@workspace/ui/components/input"

// docs/design-system/components/time-input.md · 24-hour "HH:mm" in company time.
// Two spinbutton segments; typing auto-advances, arrows step, paste "17:10" works.

type Segment = "hours" | "minutes"

const LIMITS = { hours: 23, minutes: 59 } as const

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
}

function parse(value: string | null): {
  hours: number | null
  minutes: number | null
} {
  const match = value?.match(/^(\d{2}):(\d{2})$/)
  return match
    ? { hours: Number(match[1]), minutes: Number(match[2]) }
    : { hours: null, minutes: null }
}

const pad = (value: number) => String(value).padStart(2, "0")

type TimeInputProps = {
  /** id of the visible label; the group is labelled by it. */
  labelledBy: string
  value: string | null
  onChange: (value: string | null) => void
  segmentLabels?: { hours: string; minutes: string }
  /** e.g. "AST", shown on correction forms or when the device zone differs. */
  zoneLabel?: string
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
  className?: string
}

function TimeInput({
  labelledBy,
  value,
  onChange,
  segmentLabels = { hours: "Hours", minutes: "Minutes" },
  zoneLabel,
  invalid,
  describedBy,
  disabled,
  className,
}: TimeInputProps) {
  const parsed = parse(value)
  const [draft, setDraft] = React.useState({ hours: "", minutes: "" })
  const refs = {
    hours: React.useRef<HTMLInputElement>(null),
    minutes: React.useRef<HTMLInputElement>(null),
  }

  const shown = (segment: Segment) =>
    draft[segment] !== ""
      ? draft[segment]
      : parsed[segment] === null
        ? ""
        : pad(parsed[segment]!)

  function commit(next: { hours: number | null; minutes: number | null }) {
    onChange(
      next.hours === null || next.minutes === null
        ? null
        : `${pad(next.hours)}:${pad(next.minutes)}`
    )
  }

  function step(segment: Segment, delta: number) {
    const current = parsed[segment] ?? 0
    const range = LIMITS[segment] + 1
    const next = (((current + delta) % range) + range) % range
    commit({
      hours: parsed.hours ?? 0,
      minutes: parsed.minutes ?? 0,
      [segment]: next,
    })
  }

  /** Commits once both halves are known; until then the typed half waits in the draft. */
  function settle(segment: Segment, number: number) {
    const other = segment === "hours" ? "minutes" : "hours"
    const otherNumber =
      parsed[other] ?? (draft[other] === "" ? null : Number(draft[other]))
    if (otherNumber === null) {
      setDraft((current) => ({ ...current, [segment]: pad(number) }))
    } else {
      setDraft({ hours: "", minutes: "" })
      commit({
        hours: null,
        minutes: null,
        [segment]: number,
        [other]: otherNumber,
      })
    }
  }

  function onType(segment: Segment, raw: string) {
    const digits = normalizeDigits(raw).replace(/\D/g, "").slice(-2)
    if (digits.length < 2) {
      setDraft((current) => ({ ...current, [segment]: digits }))
      return
    }
    settle(segment, Math.min(Number(digits), LIMITS[segment]))
    if (segment === "hours") refs.minutes.current?.focus()
  }

  function onKeyDown(
    segment: Segment,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    const big = event.shiftKey && segment === "minutes" ? 15 : 1
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault()
      step(segment, event.key === "ArrowUp" ? big : -big)
    } else if (event.key === "ArrowRight" && segment === "hours") {
      event.preventDefault()
      refs.minutes.current?.focus()
    } else if (event.key === "ArrowLeft" && segment === "minutes") {
      event.preventDefault()
      refs.hours.current?.focus()
    } else if (event.key === "Backspace" && shown(segment) === "") {
      if (segment === "minutes") refs.hours.current?.focus()
    } else if (event.key === "Backspace") {
      event.preventDefault()
      setDraft((current) => ({ ...current, [segment]: "" }))
      commit({ ...parsed, [segment]: null })
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const match = normalizeDigits(event.clipboardData.getData("text"))
      .trim()
      .match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return
    event.preventDefault()
    commit({
      hours: Math.min(Number(match[1]), 23),
      minutes: Math.min(Number(match[2]), 59),
    })
  }

  function onBlur(segment: Segment) {
    // A single typed digit becomes "0X" when you leave the segment.
    if (draft[segment] !== "")
      settle(segment, Math.min(Number(draft[segment]), LIMITS[segment]))
  }

  const segment = (name: Segment) => (
    <input
      ref={refs[name]}
      role="spinbutton"
      aria-label={segmentLabels[name]}
      aria-valuemin={0}
      aria-valuemax={LIMITS[name]}
      aria-valuenow={parsed[name] ?? undefined}
      aria-valuetext={parsed[name] === null ? undefined : pad(parsed[name]!)}
      inputMode="numeric"
      autoComplete="off"
      placeholder="––"
      disabled={disabled}
      value={shown(name)}
      onChange={(event) => onType(name, event.target.value)}
      onKeyDown={(event) => onKeyDown(name, event)}
      onPaste={onPaste}
      onBlur={() => onBlur(name)}
      onFocus={(event) => event.target.select()}
      className={cn(
        "tabular w-[2.5ch] rounded-xs bg-transparent text-center caret-transparent outline-none",
        "placeholder:text-muted-foreground focus:bg-brand focus:text-brand-foreground"
      )}
    />
  )

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        inputClassName,
        "flex items-center gap-2 focus-within:border-border-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring focus-within:outline-solid",
        "data-disabled:cursor-not-allowed data-disabled:bg-disabled data-disabled:text-disabled-foreground",
        className
      )}
    >
      {/* Segment order stays HH:MM in Arabic too. */}
      <span dir="ltr" className="flex items-center gap-0.5">
        {segment("hours")}
        <span aria-hidden>:</span>
        {segment("minutes")}
      </span>
      <span className="ms-auto flex items-center gap-2 text-caption text-muted-foreground">
        {zoneLabel}
        <ClockIcon aria-hidden className="size-4" />
      </span>
    </div>
  )
}

export { TimeInput, type TimeInputProps }
