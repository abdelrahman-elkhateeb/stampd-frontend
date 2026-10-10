import { addDays } from "@/features/attendance/rules"
import {
  DEMO_LEAVE_TYPES,
  DEMO_REQUEST_TYPES_ENABLED,
} from "@/features/settings/demo-data"
import { DEMO_USER } from "@/lib/demo-user"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import type { RequestStatus } from "@workspace/ui/components/status-chip"

// patterns/request-form-renderer.md: the BE-11 type metadata contract.
// ponytail: fixtures until BE-09/BE-11; GET /request-types and GET /requests replace them.

export type Localized = { en: string; ar?: string }

export type FieldType =
  | "date"
  | "date-range"
  | "time"
  | "text"
  | "textarea"
  | "select"
  | "number"
  | "boolean"

export type FieldMeta = {
  key: string
  type: FieldType | (string & {})
  label: Localized
  required?: boolean
  maxLength?: number
  min?: number
  max?: number
  /** Date constraints. Admins may go past them (BE-10: e.g. sick leave older than 30 days). */
  notBefore?: "today"
  notAfter?: "today"
  /** A time that must be later than another time field ("checkOut" after "checkIn"). */
  after?: string
  options?: { value: string; label: Localized }[]
}

export type RequestTypeMeta = {
  key: string
  label: Localized
  description: Localized
  /** leave | wfh | trip | permission | correction; anything else renders neutral. */
  category: string
  approver: "manager" | "hr"
  enabled: boolean
  /** Types with their own screen (Leave → FE-07) open it instead of the generic form. */
  flowHref?: string
  fields: FieldMeta[]
}

const REASON: FieldMeta = {
  key: "reason",
  type: "textarea",
  label: { en: "Reason", ar: "السبب" },
  required: true,
  maxLength: 500,
}

export const DEMO_REQUEST_TYPES: RequestTypeMeta[] = [
  {
    key: "leave",
    label: { en: "Leave", ar: "إجازة" },
    description: {
      en: "Annual, sick and other time off",
      ar: "الإجازة السنوية والمرضية وغيرها",
    },
    category: "leave",
    approver: "manager",
    enabled: true,
    flowHref: "/leave",
    fields: [
      {
        key: "leaveType",
        type: "select",
        label: { en: "Leave type", ar: "نوع الإجازة" },
        required: true,
        options: DEMO_LEAVE_TYPES.map((type) => ({
          value: type.id,
          label: { en: type.name },
        })),
      },
      {
        key: "dates",
        type: "date-range",
        label: { en: "Dates", ar: "التواريخ" },
        required: true,
      },
      { ...REASON, required: false },
    ],
  },
  {
    key: "wfh",
    label: { en: "Work from home", ar: "عمل عن بُعد" },
    description: {
      en: "Work from home for a day or a few days",
      ar: "العمل من المنزل ليوم أو بضعة أيام",
    },
    category: "wfh",
    approver: "manager",
    enabled: DEMO_REQUEST_TYPES_ENABLED.wfh,
    fields: [
      {
        key: "dates",
        type: "date-range",
        label: { en: "Dates", ar: "التواريخ" },
        required: true,
        notBefore: "today",
      },
      REASON,
    ],
  },
  {
    key: "correction",
    label: { en: "Attendance correction", ar: "تصحيح الحضور" },
    description: {
      en: "Fix a missed or wrong check-in or check-out",
      ar: "تصحيح تسجيل حضور أو انصراف فائت أو خاطئ",
    },
    category: "correction",
    approver: "hr",
    enabled: DEMO_REQUEST_TYPES_ENABLED.correction,
    fields: [
      {
        key: "date",
        type: "date",
        label: { en: "Day", ar: "اليوم" },
        required: true,
        notAfter: "today",
      },
      {
        key: "checkIn",
        type: "time",
        label: { en: "Check-in", ar: "الحضور" },
        required: true,
      },
      {
        key: "checkOut",
        type: "time",
        label: { en: "Check-out", ar: "الانصراف" },
        required: true,
        after: "checkIn",
      },
      REASON,
    ],
  },
  {
    key: "permission",
    label: { en: "Permission", ar: "استئذان" },
    description: {
      en: "Leave early or step out for a few hours",
      ar: "المغادرة مبكرًا أو الخروج لبضع ساعات",
    },
    category: "permission",
    approver: "manager",
    enabled: DEMO_REQUEST_TYPES_ENABLED.permission,
    fields: [
      {
        key: "date",
        type: "date",
        label: { en: "Day", ar: "اليوم" },
        required: true,
        notBefore: "today",
      },
      {
        key: "from",
        type: "time",
        label: { en: "From", ar: "من" },
        required: true,
      },
      {
        key: "to",
        type: "time",
        label: { en: "To", ar: "إلى" },
        required: true,
        after: "from",
      },
      REASON,
    ],
  },
  {
    key: "trip",
    label: { en: "Business trip", ar: "رحلة عمل" },
    description: { en: "Travel for work", ar: "سفر لأغراض العمل" },
    category: "trip",
    approver: "manager",
    enabled: DEMO_REQUEST_TYPES_ENABLED.trip,
    fields: [
      {
        key: "dates",
        type: "date-range",
        label: { en: "Dates", ar: "التواريخ" },
        required: true,
        notBefore: "today",
      },
      {
        key: "destination",
        type: "text",
        label: { en: "Destination", ar: "الوجهة" },
        required: true,
        maxLength: 80,
      },
      {
        key: "purpose",
        type: "textarea",
        label: { en: "Purpose", ar: "الغرض" },
        required: true,
        maxLength: 500,
      },
    ],
  },
]

export type DateRange = { from: PlainDate; to: PlainDate }
export type FieldValue = string | number | boolean | DateRange | null

export type RequestEvent = {
  id: string
  kind: "submitted" | Exclude<RequestStatus, "pending">
  actor: string
  /** Set when an admin acted for the employee. */
  onBehalfOf?: string
  /** ISO instant. */
  at: string
  comment?: string
}

export type MyRequest = {
  id: string
  type: string
  employeeId: string
  employeeName: string
  /** The manager's name, or null when HR reviews it. */
  approver: string | null
  status: RequestStatus
  values: Record<string, FieldValue>
  /** Oldest first. */
  events: RequestEvent[]
}

const at = (day: PlainDate, time: string) => `${day}T${time}:00+03:00`

/** Generated relative to today so the demo never goes stale. */
export function demoRequests(today: PlainDate): MyRequest[] {
  const me = { employeeId: DEMO_USER.id, employeeName: DEMO_USER.name }
  const manager = DEMO_USER.manager
  const day = (offset: number) => addDays(today, offset)
  return [
    {
      id: "2041",
      type: "wfh",
      ...me,
      approver: manager,
      status: "pending",
      values: {
        dates: { from: day(2), to: day(2) },
        reason: "Waiting for a furniture delivery in the morning.",
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: DEMO_USER.name,
          at: at(today, "08:40"),
        },
      ],
    },
    {
      id: "2033",
      type: "leave",
      ...me,
      approver: manager,
      status: "approved",
      values: {
        leaveType: "annual",
        dates: { from: day(12), to: day(15) },
        reason: null,
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: DEMO_USER.name,
          at: at(day(-6), "10:05"),
        },
        { id: "b", kind: "approved", actor: manager, at: at(day(-5), "09:12") },
      ],
    },
    {
      id: "2027",
      type: "permission",
      ...me,
      approver: manager,
      status: "rejected",
      values: {
        date: day(-3),
        from: "14:00",
        to: "17:00",
        reason: "School pick-up.",
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: DEMO_USER.name,
          at: at(day(-5), "11:30"),
        },
        {
          id: "b",
          kind: "rejected",
          actor: manager,
          at: at(day(-4), "16:02"),
          comment:
            "The quarterly review is that afternoon. Can you take the morning instead?",
        },
      ],
    },
    {
      id: "2019",
      type: "correction",
      ...me,
      approver: null,
      status: "approved",
      values: {
        date: day(-9),
        checkIn: "07:55",
        checkOut: "17:02",
        reason: "Forgot to check out; the badge log shows 17:02.",
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: DEMO_USER.name,
          at: at(day(-9), "18:20"),
        },
        { id: "b", kind: "approved", actor: "HR", at: at(day(-8), "09:14") },
      ],
    },
    {
      id: "2012",
      type: "wfh",
      ...me,
      approver: manager,
      status: "withdrawn",
      values: {
        dates: { from: day(-14), to: day(-13) },
        reason: "Plumber visit.",
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: DEMO_USER.name,
          at: at(day(-17), "09:00"),
        },
        {
          id: "b",
          kind: "withdrawn",
          actor: DEMO_USER.name,
          at: at(day(-16), "08:31"),
        },
      ],
    },
    {
      // Already started: only an admin can still cancel it (FE-08 AC).
      id: "2008",
      type: "leave",
      ...me,
      approver: manager,
      status: "approved",
      values: {
        leaveType: "sick",
        dates: { from: day(-1), to: day(1) },
        reason: "Flu, doctor's note attached by email.",
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: DEMO_USER.name,
          at: at(day(-1), "07:10"),
        },
        { id: "b", kind: "approved", actor: manager, at: at(day(-1), "08:02") },
      ],
    },
    {
      // Someone else's: a deep link to it shows the no-access page for non-admins.
      id: "1990",
      type: "wfh",
      employeeId: "e-3",
      employeeName: "Omar Haddad",
      approver: "Khalid Al-Otaibi",
      status: "pending",
      values: {
        dates: { from: day(3), to: day(3) },
        reason: "Home internet installation.",
      },
      events: [
        {
          id: "a",
          kind: "submitted",
          actor: "Omar Haddad",
          at: at(today, "07:45"),
        },
      ],
    },
  ]
}
