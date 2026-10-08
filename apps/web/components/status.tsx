"use client"

import { useTranslations } from "next-intl"

import {
  FlagChip,
  StatusChip,
  type ChipStatus,
  type Flag,
} from "@workspace/ui/components/status-chip"

// One name per status everywhere (FE-15): the keys come from docs/design-system/content.md.
const STATUS_KEYS = {
  present: "status.present",
  late: "status.late",
  absent: "status.absent",
  wfh: "status.wfh",
  leave: "status.onLeave",
  trip: "status.businessTrip",
  holiday: "status.holiday",
  weekend: "status.weekend",
  missing: "status.missingCheckout",
  "not-yet": "status.notYet",
  out: "status.out",
  pending: "request.pending",
  approved: "request.approved",
  rejected: "request.rejected",
  withdrawn: "request.withdrawn",
  "cancel-requested": "request.cancelRequested",
  cancelled: "request.cancelled",
  invited: "account.invited",
  active: "account.active",
  deactivated: "account.deactivated",
} as const satisfies Record<ChipStatus, string>

const FLAG_KEYS = {
  late: "flag.late",
  "missing-checkout": "flag.missingCheckout",
  corrected: "flag.corrected",
  "wfh-no-checkin": "flag.wfhNoCheckin",
  "worked-non-working-day": "flag.workedNonWorkingDay",
  overdue: "flag.overdue",
} as const satisfies Record<Flag, string>

export function Status({
  status,
  size,
  qualifier,
}: {
  status: ChipStatus
  size?: "md" | "sm"
  qualifier?: string
}) {
  const t = useTranslations()
  return (
    <StatusChip
      status={status}
      label={t(STATUS_KEYS[status])}
      size={size}
      qualifier={qualifier}
    />
  )
}

export function StatusFlag({ flag }: { flag: Flag }) {
  const t = useTranslations()
  return <FlagChip flag={flag} label={t(FLAG_KEYS[flag])} />
}

/** The status name alone, e.g. for aria-labels. */
export function useStatusLabel() {
  const t = useTranslations()
  return (status: ChipStatus) => t(STATUS_KEYS[status])
}
