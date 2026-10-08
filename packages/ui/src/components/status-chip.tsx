import {
  AlarmClockIcon,
  BanIcon,
  CalendarMinus2Icon,
  CalendarOffIcon,
  CalendarXIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockAlertIcon,
  ClockIcon,
  HourglassIcon,
  HouseIcon,
  LogOutIcon,
  MailIcon,
  PencilLineIcon,
  PlaneIcon,
  SunIcon,
  UmbrellaIcon,
  Undo2Icon,
  UserCheckIcon,
  UserXIcon,
  BriefcaseIcon,
  HouseWifiIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

// docs/design-system/components/status-chip.md · icons from iconography.md
export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "absent",
  "wfh",
  "leave",
  "trip",
  "holiday",
  "weekend",
  "missing",
  "not-yet",
  "out",
] as const
export const REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "cancel-requested",
  "cancelled",
] as const
export const ACCOUNT_STATUSES = ["invited", "active", "deactivated"] as const
export const FLAGS = [
  "late",
  "missing-checkout",
  "corrected",
  "wfh-no-checkin",
  "worked-non-working-day",
  "overdue",
] as const

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]
export type RequestStatus = (typeof REQUEST_STATUSES)[number]
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]
export type Flag = (typeof FLAGS)[number]
export type ChipStatus = AttendanceStatus | RequestStatus | AccountStatus

type Meta = {
  icon: LucideIcon
  tone: string
  family: "attendance" | "request"
  dashed?: boolean
  flip?: boolean
}

// The tone classes are written out in full so Tailwind can see them.
const STATUS_META: Record<ChipStatus, Meta> = {
  present: {
    icon: CircleCheckIcon,
    tone: "bg-status-present-bg text-status-present",
    family: "attendance",
  },
  late: {
    icon: ClockAlertIcon,
    tone: "bg-status-late-bg text-status-late",
    family: "attendance",
  },
  absent: {
    icon: CircleXIcon,
    tone: "bg-status-absent-bg text-status-absent",
    family: "attendance",
  },
  wfh: {
    icon: HouseIcon,
    tone: "bg-status-wfh-bg text-status-wfh",
    family: "attendance",
  },
  leave: {
    icon: UmbrellaIcon,
    tone: "bg-status-leave-bg text-status-leave",
    family: "attendance",
  },
  trip: {
    icon: PlaneIcon,
    tone: "bg-status-trip-bg text-status-trip",
    family: "attendance",
    flip: true,
  },
  holiday: {
    icon: SunIcon,
    tone: "bg-status-holiday-bg text-status-holiday",
    family: "attendance",
  },
  // Not in the design system yet (FE-01 lists it): neutral "out" tones until design signs it off.
  weekend: {
    icon: CalendarMinus2Icon,
    tone: "bg-status-out-bg text-status-out",
    family: "attendance",
  },
  missing: {
    icon: LogOutIcon,
    tone: "bg-status-missing-bg text-status-missing",
    family: "attendance",
    dashed: true,
    flip: true,
  },
  "not-yet": {
    icon: ClockIcon,
    tone: "bg-status-not-yet-bg text-status-not-yet",
    family: "attendance",
  },
  out: {
    icon: CalendarOffIcon,
    tone: "bg-status-out-bg text-status-out",
    family: "attendance",
  },
  pending: {
    icon: HourglassIcon,
    tone: "bg-status-pending-bg text-status-pending",
    family: "request",
  },
  approved: {
    icon: CheckIcon,
    tone: "bg-status-approved-bg text-status-approved",
    family: "request",
  },
  rejected: {
    icon: XIcon,
    tone: "bg-status-rejected-bg text-status-rejected",
    family: "request",
  },
  withdrawn: {
    icon: Undo2Icon,
    tone: "bg-status-withdrawn-bg text-status-withdrawn",
    family: "request",
    flip: true,
  },
  "cancel-requested": {
    icon: CalendarXIcon,
    tone: "bg-status-cancel-requested-bg text-status-cancel-requested",
    family: "request",
    dashed: true,
  },
  cancelled: {
    icon: BanIcon,
    tone: "bg-status-cancelled-bg text-status-cancelled",
    family: "request",
  },
  invited: { icon: MailIcon, tone: "bg-info-bg text-info", family: "request" },
  active: {
    icon: UserCheckIcon,
    tone: "bg-success-bg text-success",
    family: "request",
  },
  deactivated: {
    icon: UserXIcon,
    tone: "bg-status-cancelled-bg text-status-cancelled",
    family: "request",
  },
}

const FLAG_META: Record<Flag, Omit<Meta, "family">> = {
  late: { icon: ClockAlertIcon, tone: "bg-status-late-bg text-status-late" },
  "missing-checkout": {
    icon: LogOutIcon,
    tone: "bg-status-missing-bg text-status-missing",
    dashed: true,
    flip: true,
  },
  corrected: { icon: PencilLineIcon, tone: "bg-info-bg text-info" },
  // Not in the design system yet (FE-01 lists them): pending design review.
  "wfh-no-checkin": { icon: HouseWifiIcon, tone: "bg-warning-bg text-warning" },
  "worked-non-working-day": {
    icon: BriefcaseIcon,
    tone: "bg-info-bg text-info",
  },
  overdue: { icon: AlarmClockIcon, tone: "bg-warning-bg text-warning" },
}

type ChipProps = {
  /** The translated status name (content.md keys). Never colour without it. */
  label: string
  size?: "md" | "sm"
  /** Short extra detail, e.g. "14m" or "step 1 of 2". */
  qualifier?: string
  className?: string
}

function chipClasses(
  meta: Omit<Meta, "family">,
  shape: "pill" | "tag",
  size: "md" | "sm"
) {
  return cn(
    "inline-flex w-fit max-w-full shrink-0 items-center gap-1.5 font-semibold whitespace-nowrap",
    shape === "pill" ? "rounded-pill" : "rounded-sm",
    size === "md"
      ? "h-chip px-2.5 text-body-sm"
      : "h-chip-sm px-2 text-caption",
    meta.dashed && "border border-dashed border-current",
    meta.tone
  )
}

function ChipContent({
  meta,
  label,
  qualifier,
  size,
}: {
  meta: Omit<Meta, "family">
  label: string
  qualifier?: string
  size: "md" | "sm"
}) {
  const Icon = meta.icon
  return (
    <>
      <Icon
        aria-hidden
        className={cn(
          size === "md" ? "size-4" : "size-3.5",
          meta.flip && "flip-rtl"
        )}
      />
      <span className="truncate">{label}</span>
      {qualifier ? <span className="font-normal">· {qualifier}</span> : null}
    </>
  )
}

function StatusChip({
  status,
  label,
  size = "md",
  qualifier,
  className,
}: ChipProps & { status: ChipStatus }) {
  const meta = STATUS_META[status]
  return (
    <span
      data-slot="status-chip"
      data-status={status}
      className={cn(
        chipClasses(meta, meta.family === "attendance" ? "pill" : "tag", size),
        className
      )}
    >
      <ChipContent
        meta={meta}
        label={label}
        qualifier={qualifier}
        size={size}
      />
    </span>
  )
}

function FlagChip({
  flag,
  label,
  className,
}: Omit<ChipProps, "size" | "qualifier"> & { flag: Flag }) {
  const meta = FLAG_META[flag]
  return (
    <span
      data-slot="flag-chip"
      data-flag={flag}
      className={cn(chipClasses(meta, "tag", "sm"), className)}
    >
      <ChipContent meta={meta} label={label} size="sm" />
    </span>
  )
}

/** The calendar `bar` size: a 4px bar (dashed when it needs action) over a 12px icon. */
function StatusBar({
  status,
  className,
}: {
  status: AttendanceStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      aria-hidden
      data-slot="status-bar"
      data-status={status}
      className={cn(
        "flex w-full flex-col items-center gap-1",
        meta.tone.split(" ").find((tone) => tone.startsWith("text-")),
        className
      )}
    >
      <span
        className={cn(
          "w-full border-t-4 border-current",
          meta.dashed && "border-dashed"
        )}
      />
      <Icon className={cn("size-3", meta.flip && "flip-rtl")} />
    </span>
  )
}

export { FlagChip, StatusBar, StatusChip }
