import { DEMO_USER } from "@/lib/demo-user"
import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"
import type { LeaveIconKey } from "@workspace/ui/components/icon-picker"

// ponytail: fixtures until BE-05 (company, holidays), BE-08 (leave types) and BE-11 (request
// types) exist. Edits live in component state and reset on reload.

export type CompanySettings = {
  name: string
  timezone: string
  /** Tenant accent, 6-digit hex (layout.md › Tenant branding). */
  accent: string
  workingDays: Weekday[]
  workStart: string
  workEnd: string
  graceMinutes: number
  /** 1 = January. */
  leaveYearStartMonth: number
}

export const DEMO_COMPANY: CompanySettings = {
  name: DEMO_USER.company.name,
  timezone: DEMO_USER.company.timezone,
  accent: "#F9DC5C",
  workingDays: DEMO_USER.company.workingDays,
  workStart: "08:00",
  workEnd: "17:00",
  graceMinutes: 15,
  leaveYearStartMonth: 1,
}

export type HolidayItem = { id: string; date: PlainDate; name: string }

export const DEMO_HOLIDAYS: HolidayItem[] = [
  { id: "h1", date: "2026-02-22", name: "Founding Day" },
  { id: "h2", date: "2026-03-20", name: "Eid al-Fitr" },
  { id: "h3", date: "2026-03-22", name: "Eid al-Fitr holiday" },
  { id: "h4", date: "2026-05-26", name: "Arafat Day" },
  { id: "h5", date: "2026-05-27", name: "Eid al-Adha" },
  { id: "h6", date: "2026-09-23", name: "Saudi National Day" },
  { id: "h7", date: "2027-02-22", name: "Founding Day" },
  { id: "h8", date: "2027-09-23", name: "Saudi National Day" },
]

export type ApprovedRequest = {
  id: string
  employee: string
  type: string
  from: PlainDate
  to: PlainDate
}

/** Approved requests a new holiday may land on (BE-05 returns these). */
export const DEMO_APPROVED_REQUESTS: ApprovedRequest[] = [
  {
    id: "1042",
    employee: "Khalid Al-Otaibi",
    type: "Annual leave",
    from: "2026-10-18",
    to: "2026-10-22",
  },
  {
    id: "1057",
    employee: "Noura Al-Qahtani",
    type: "Business trip",
    from: "2026-10-20",
    to: "2026-10-21",
  },
  {
    id: "1063",
    employee: "Omar Haddad",
    type: "WFH",
    from: "2026-11-05",
    to: "2026-11-05",
  },
]

export type LeaveType = {
  id: string
  name: string
  icon: LeaveIconKey
  paid: boolean
  tracked: boolean
  /** Days per leave year; only for tracked types. */
  allowance: number
  allowNegative: boolean
  halfDays: boolean
  reasonRequired: boolean
  /** Used by at least one request, so it can only be archived. */
  inUse: boolean
  archived: boolean
}

// The four seeded types every new company starts with (FE-04 business rules).
export const DEMO_LEAVE_TYPES: LeaveType[] = [
  {
    id: "annual",
    name: "Annual leave",
    icon: "tree-palm",
    paid: true,
    tracked: true,
    allowance: 21,
    allowNegative: false,
    halfDays: true,
    reasonRequired: false,
    inUse: true,
    archived: false,
  },
  {
    id: "sick",
    name: "Sick leave",
    icon: "thermometer",
    paid: true,
    tracked: true,
    allowance: 30,
    allowNegative: false,
    halfDays: false,
    reasonRequired: true,
    inUse: true,
    archived: false,
  },
  {
    id: "emergency",
    name: "Emergency leave",
    icon: "siren",
    paid: true,
    tracked: true,
    allowance: 3,
    allowNegative: false,
    halfDays: true,
    reasonRequired: true,
    inUse: false,
    archived: false,
  },
  {
    id: "unpaid",
    name: "Unpaid leave",
    icon: "banknote",
    paid: false,
    tracked: false,
    allowance: 0,
    allowNegative: false,
    halfDays: false,
    reasonRequired: true,
    inUse: false,
    archived: false,
  },
]

export const REQUEST_TYPES = [
  "wfh",
  "correction",
  "permission",
  "trip",
] as const
export type RequestTypeId = (typeof REQUEST_TYPES)[number]

export const DEMO_REQUEST_TYPES_ENABLED: Record<RequestTypeId, boolean> = {
  wfh: true,
  correction: true,
  permission: true,
  trip: false,
}

export type SettingsChange = {
  id: string
  actor: string
  /** ISO instant. */
  at: string
  fields: {
    field: keyof CompanySettings
    from: CompanySettings[keyof CompanySettings]
    to: CompanySettings[keyof CompanySettings]
  }[]
}

export const DEMO_SETTINGS_HISTORY: SettingsChange[] = [
  {
    id: "c2",
    actor: "Sara Al-Harbi",
    at: "2026-09-14T07:12:00Z",
    fields: [{ field: "graceMinutes", from: 10, to: 15 }],
  },
  {
    id: "c1",
    actor: "Sara Al-Harbi",
    at: "2026-08-02T09:40:00Z",
    fields: [
      { field: "workStart", from: "09:00", to: "08:00" },
      { field: "workingDays", from: [1, 2, 3, 4, 5], to: [0, 1, 2, 3, 4] },
    ],
  },
]
