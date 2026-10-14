"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  BabyIcon,
  BanknoteIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  HeartIcon,
  LandmarkIcon,
  MoonIcon,
  SirenIcon,
  ThermometerIcon,
  TreePalmIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

// docs/design-system/components/icon-picker.md · hand-written: shadcn has no icon picker.
// A closed, ordered set (decision 21): leave types share --cat-leave and differ by icon.

export const LEAVE_ICONS = {
  // Keyed by the API's icon names (BE-08).
  annual: TreePalmIcon,
  sick: ThermometerIcon,
  emergency: SirenIcon,
  unpaid: BanknoteIcon,
  hajj: LandmarkIcon,
  maternity: BabyIcon,
  paternity: UsersIcon,
  marriage: HeartIcon,
  study: GraduationCapIcon,
  bereavement: MoonIcon,
  other: BriefcaseIcon,
} satisfies Record<string, LucideIcon>

export type LeaveIconKey = keyof typeof LEAVE_ICONS

const KEYS = Object.keys(LEAVE_ICONS) as LeaveIconKey[]

/** A leave type's icon on its category tile. */
function LeaveIcon({
  icon,
  className,
}: {
  icon: LeaveIconKey
  className?: string
}) {
  const Icon = LEAVE_ICONS[icon]
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md border border-border-strong bg-cat-leave text-foreground",
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}

type IconPickerProps = {
  id?: string
  value: LeaveIconKey | null
  onChange: (icon: LeaveIconKey) => void
  /** Icons other types already use, with that type's name. */
  usedBy: Partial<Record<LeaveIconKey, string>>
  /** Accessible names for the icons ("Palm tree"). */
  iconNames: Record<LeaveIconKey, string>
  labels: {
    placeholder: string
    group: string
    /** "In use by {type}" */
    inUse: (type: string) => string
    footnote: string
  }
  invalid?: boolean
  describedBy?: string
}

function IconPicker({
  id,
  value,
  onChange,
  usedBy,
  iconNames,
  labels,
  invalid,
  describedBy,
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          aria-haspopup="dialog"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "flex h-control w-full items-center gap-3 rounded-md border border-input bg-card px-2 text-start text-ui outline-none hover:border-input-hover",
            "focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
            "aria-invalid:border-[1.5px] aria-invalid:border-error"
          )}
        >
          {value ? <LeaveIcon icon={value} className="compact:size-6" /> : null}
          <span
            className={cn("flex-1 truncate", !value && "text-muted-foreground")}
          >
            {value ? iconNames[value] : labels.placeholder}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="size-4 text-muted-foreground"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <RadioGroupPrimitive.Root
          aria-label={labels.group}
          value={value ?? ""}
          onValueChange={(next) => {
            onChange(next as LeaveIconKey)
            setOpen(false)
          }}
          className="grid grid-cols-6 gap-2"
        >
          {KEYS.map((key) => {
            const Icon = LEAVE_ICONS[key]
            const owner = usedBy[key]
            return (
              <RadioGroupPrimitive.Item
                key={key}
                value={key}
                disabled={Boolean(owner)}
                aria-label={
                  owner
                    ? `${iconNames[key]}, ${labels.inUse(owner)}`
                    : iconNames[key]
                }
                title={owner ? labels.inUse(owner) : iconNames[key]}
                className={cn(
                  "flex size-11 items-center justify-center rounded-md border border-border bg-card outline-none hover:bg-accent",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
                  "data-[state=checked]:bg-cat-leave data-[state=checked]:shadow-[inset_0_0_0_2px_var(--border-strong)]",
                  "disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-45"
                )}
              >
                <Icon aria-hidden className="size-5" />
              </RadioGroupPrimitive.Item>
            )
          })}
        </RadioGroupPrimitive.Root>
        <p className="mt-3 max-w-[18rem] text-caption text-muted-foreground">
          {labels.footnote}
        </p>
      </PopoverContent>
    </Popover>
  )
}

export { IconPicker, LeaveIcon, type IconPickerProps }
