"use client"

import { Status, StatusFlag } from "@/components/status"
import { Badge, CountBadge } from "@workspace/ui/components/badge"
import {
  PersonAvatar,
  PersonAvatarGroup,
} from "@workspace/ui/components/avatar"
import {
  ACCOUNT_STATUSES,
  ATTENDANCE_STATUSES,
  FLAGS,
  REQUEST_STATUSES,
} from "@workspace/ui/components/status-chip"

import { Demo } from "../demo"

const PEOPLE = [
  { name: "Sara Al-Harbi", userId: "u-1" },
  { name: "Omar Khalid", userId: "u-2" },
  { name: "لينا حداد", userId: "u-3" },
  { name: "Fatima Al-Zahrani", userId: "u-4" },
  { name: "Khalid Noor", userId: "u-5" },
  { name: "Maha Saeed", userId: "u-6" },
]

export function StatusSection() {
  return (
    <div className="flex flex-col gap-8">
      <Demo title="Attendance status (pill) · md">
        {ATTENDANCE_STATUSES.map((status) => (
          <Status
            key={status}
            status={status}
            qualifier={status === "late" ? "14m" : undefined}
          />
        ))}
      </Demo>
      <Demo title="Attendance status · sm (tables, calendars)">
        {ATTENDANCE_STATUSES.map((status) => (
          <Status key={status} status={status} size="sm" />
        ))}
      </Demo>
      <Demo title="Request status (tag)">
        {REQUEST_STATUSES.map((status) => (
          <Status key={status} status={status} />
        ))}
      </Demo>
      <Demo title="Account status">
        {ACCOUNT_STATUSES.map((status) => (
          <Status key={status} status={status} />
        ))}
      </Demo>
      <Demo title="Flags">
        {FLAGS.map((flag) => (
          <StatusFlag key={flag} flag={flag} />
        ))}
      </Demo>
      <Demo title="Badges">
        <span className="inline-flex items-center gap-2">
          Approvals <CountBadge count={7} />
        </span>
        <span className="inline-flex items-center gap-2">
          Corrections <CountBadge count={5} variant="count-attention" />
        </span>
        <span className="inline-flex items-center gap-2">
          Notifications <CountBadge count={12} max={9} variant="alert" />
        </span>
        <Badge variant="new">New</Badge>
        <Badge variant="neutral">Draft</Badge>
      </Demo>
      <Demo title="Avatars · 24 / 32 / 40 / 56, presence, tenant ring, group">
        <PersonAvatar name="Sara Al-Harbi" userId="u-1" size={24} />
        <PersonAvatar
          name="Omar Khalid"
          userId="u-2"
          size={32}
          presenceClassName="bg-status-present"
        />
        <PersonAvatar name="لينا حداد" userId="u-3" size={40} />
        <PersonAvatar
          name="Fatima Al-Zahrani"
          userId="u-4"
          size={56}
          tenantRing
        />
        <PersonAvatarGroup
          people={PEOPLE}
          moreLabel={(count) => `and ${count} more`}
        />
      </Demo>
    </div>
  )
}
