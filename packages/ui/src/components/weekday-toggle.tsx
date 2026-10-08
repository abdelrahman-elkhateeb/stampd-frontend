"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import type { Weekday } from "@workspace/ui/components/date-picker"

// docs/design-system/components/weekday-toggle.md · Radix ToggleGroup (shadcn's toggle-group
// base), restyled as 44px round day buttons in company week order.

type WeekdayToggleProps = {
  labelledBy: string
  value: Weekday[]
  onChange: (days: Weekday[]) => void
  weekStartsOn: Weekday
  /** Index 0 = Sunday. `short` shows on the button, `long` is its accessible name. */
  dayNames: { short: string; long: string }[]
  /** Called instead of onChange when the last selected day is deselected. */
  onEmpty?: () => void
  describedBy?: string
  disabled?: boolean
}

function WeekdayToggle({
  labelledBy,
  value,
  onChange,
  weekStartsOn,
  dayNames,
  onEmpty,
  describedBy,
  disabled,
}: WeekdayToggleProps) {
  const order = Array.from(
    { length: 7 },
    (_, index) => ((weekStartsOn + index) % 7) as Weekday
  )

  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      value={value.map(String)}
      onValueChange={(next) => {
        // At least one working day stays selected.
        if (next.length === 0) return onEmpty?.()
        onChange(next.map(Number).sort() as Weekday[])
      }}
      className="flex flex-wrap gap-2"
    >
      {order.map((day) => (
        <ToggleGroupPrimitive.Item
          key={day}
          value={String(day)}
          aria-label={dayNames[day]!.long}
          title={dayNames[day]!.long}
          className={cn(
            "flex size-11 items-center justify-center rounded-pill border border-input bg-card text-body-sm font-medium outline-none",
            "hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
            "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:font-bold data-[state=on]:text-primary-foreground",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          {dayNames[day]!.short}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}

export { WeekdayToggle, type WeekdayToggleProps }
