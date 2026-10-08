"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { MinusIcon, PlusIcon } from "lucide-react"

// docs/design-system/components/number-stepper.md · hand-written: shadcn has no number field.
// Typed values are not clamped, so a negative allowance can show its error (FE-04 AC).

function toAscii(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[−–]/g, "-")
}

type NumberStepperProps = {
  id?: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** "days", "min": shown after the value and read as part of it. */
  unit?: string
  labels: { increase: string; decrease: string }
  invalid?: boolean
  describedBy?: string
  disabled?: boolean
  onBlur?: () => void
}

function NumberStepper({
  id,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  labels,
  invalid,
  describedBy,
  disabled,
  onBlur,
}: NumberStepperProps) {
  const [draft, setDraft] = React.useState<string | null>(null)

  const set = (next: number) =>
    onChange(Math.min(max, Math.max(min, Math.round(next / step) * step)))

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const current = value ?? min
    const moves: Record<string, number> = {
      ArrowUp: current + step,
      ArrowDown: current - step,
      PageUp: current + 10 * step,
      PageDown: current - 10 * step,
      Home: min,
      End: max,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    setDraft(null)
    set(next)
  }

  const button = (direction: 1 | -1) => (
    <button
      type="button"
      tabIndex={-1}
      aria-label={direction === 1 ? labels.increase : labels.decrease}
      aria-controls={id}
      disabled={
        disabled ||
        (direction === 1 ? (value ?? min) >= max : (value ?? min) <= min)
      }
      onClick={() => {
        setDraft(null)
        set((value ?? min) + direction * step)
      }}
      className="flex size-control shrink-0 items-center justify-center bg-muted text-foreground outline-none hover:bg-accent-strong disabled:cursor-not-allowed disabled:text-disabled-foreground disabled:hover:bg-muted"
    >
      {direction === 1 ? (
        <PlusIcon aria-hidden className="size-4" />
      ) : (
        <MinusIcon aria-hidden className="size-4" />
      )}
    </button>
  )

  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        "flex h-control w-fit! items-stretch overflow-hidden rounded-md border border-input bg-card",
        "focus-within:border-border-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring focus-within:outline-solid",
        "data-invalid:border-[1.5px] data-invalid:border-error"
      )}
    >
      {button(-1)}
      <div className="flex items-center gap-1 border-x border-border px-2">
        <input
          id={id}
          role="spinbutton"
          inputMode="numeric"
          autoComplete="off"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={
            value === null ? undefined : unit ? `${value} ${unit}` : undefined
          }
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={draft ?? (value === null ? "" : String(value))}
          onChange={(event) => {
            const text = toAscii(event.target.value).replace(/[^\d.-]/g, "")
            setDraft(text)
            const parsed = Number(text)
            if (text !== "" && text !== "-" && !Number.isNaN(parsed))
              onChange(parsed)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // Empty on blur restores the previous value.
            setDraft(null)
            onBlur?.()
          }}
          className="tabular w-[4.5ch] bg-transparent text-center font-bold outline-none"
        />
        {unit ? (
          <span aria-hidden className="text-body-sm text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      {button(1)}
    </div>
  )
}

export { NumberStepper, type NumberStepperProps }
