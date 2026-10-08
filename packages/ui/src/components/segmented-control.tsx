"use client"

import type { LucideIcon } from "lucide-react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/segmented-control.md · Radix ToggleGroup type="single"
// (shadcn's toggle-group base), restyled as a pill track.

type SegmentedControlProps<T extends string> = {
  "aria-label": string
  value: T
  onValueChange: (value: T) => void
  options: { value: T; label: string; icon?: LucideIcon }[]
  className?: string
}

function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      aria-label={props["aria-label"]}
      value={value}
      // A segment can't be switched off: one view is always selected.
      onValueChange={(next) => next && onValueChange(next as T)}
      className={cn(
        "inline-flex h-control-sm w-fit items-stretch rounded-pill bg-muted p-1",
        className
      )}
    >
      {options.map(({ value: option, label, icon: Icon }) => (
        <ToggleGroupPrimitive.Item
          key={option}
          value={option}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-4 text-body font-semibold text-foreground outline-none",
            "hover:bg-accent-strong focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
            "disabled:text-disabled-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          )}
        >
          {Icon ? <Icon aria-hidden className="size-4" /> : null}
          {label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}

export { SegmentedControl, type SegmentedControlProps }
