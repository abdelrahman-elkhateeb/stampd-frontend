import { DEMO_USER, type Role } from "@/lib/demo-user"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import type { AccountStatus } from "@workspace/ui/components/status-chip"

// ponytail: fixtures until BE-06 (employees, departments) and BE-08 (balances) exist.
// Edits live in ./store and reset on reload.

export type Department = { id: string; name: string }

export type Employee = {
  id: string
  name: string
  email: string
  code: string
  jobTitle: string
  departmentId: string | null
  managerId: string | null
  role: Role
  status: AccountStatus
  joinedOn: PlainDate
  /** Deactivation impact; the API returns these (FE-05 AC). */
  pendingRequests: number
  upcomingLeaveDays: number
}

export type LedgerEntryType =
  | "allowance"
  | "adjustment"
  | "reservation"
  | "release"
  | "deduction"
  | "restoration"

export type LedgerEntry = {
  id: string
  employeeId: string
  leaveTypeId: string
  date: PlainDate
  type: LedgerEntryType
  details: string
  href?: string
  amount: number
  actor?: string
  reason?: string
}

export type EmployeeAction =
  | "created"
  | "updated"
  | "deactivated"
  | "reactivated"
  | "inviteSent"
  | "balanceAdjusted"
  | "imported"

/** Values are display text, except `role` and `status`, which are translated keys. */
export type EmployeeChange = {
  id: string
  employeeId: string
  action: EmployeeAction
  actor: string
  /** ISO instant. */
  at: string
  fields: { field: string; from: string; to: string }[]
  reason?: string
}

export const DEMO_DEPARTMENTS: Department[] = [
  { id: "d-ops", name: "Operations" },
  { id: "d-people", name: DEMO_USER.department },
  { id: "d-finance", name: "Finance" },
  { id: "d-sales", name: "Sales" },
  { id: "d-eng", name: "Engineering" },
]

// [name, job title, department, manager id, role, status]
type Seed = [string, string, string, string | null, Role, AccountStatus]

const LEADS: Seed[] = [
  ["Khalid Al-Otaibi", "General Manager", "d-ops", null, "manager", "active"],
  [DEMO_USER.name, DEMO_USER.jobTitle, "d-people", "e-1", "admin", "active"],
  ["Omar Haddad", "Finance Lead", "d-finance", "e-1", "manager", "active"],
  ["Noura Al-Qahtani", "Sales Manager", "d-sales", "e-1", "manager", "active"],
  ["Faisal Al-Dosari", "Engineering Lead", "d-eng", "e-1", "manager", "active"],
]

const STAFF = [
  "Lina Haddad",
  "Fatima Al-Zahrani",
  "Maha Saeed",
  "Yousef Hamdan",
  "Ahmed Farouk",
  "Reem Al-Qahtani",
  "Huda Mansour",
  "Tariq Al-Amri",
  "Layla Ibrahim",
  "Saeed Al-Mutairi",
  "Dana Al-Shehri",
  "Majed Al-Ghamdi",
  "Rana Hijazi",
  "Bader Al-Subaie",
  "Mona Al-Rashid",
  "Hassan Al-Zahrani",
  "Aisha Kareem",
  "Nasser Al-Harthi",
  "Salma Yasin",
  "Waleed Al-Anazi",
  "Ziad Al-Malki",
  "Abeer Al-Juhani",
  "Rashed Al-Kaabi",
  "Jana Al-Yami",
]

const TEAMS = [
  ["d-ops", "e-1", "Operations Specialist"],
  ["d-finance", "e-3", "Accountant"],
  ["d-sales", "e-4", "Account Executive"],
  ["d-eng", "e-5", "Software Engineer"],
  ["d-people", "e-2", "HR Generalist"],
] as const

const SEEDS: Seed[] = [
  ...LEADS,
  ...STAFF.map((name, index): Seed => {
    const [department, manager, title] = TEAMS[index % TEAMS.length]!
    const status: AccountStatus =
      index % 11 === 3 ? "invited" : index % 13 === 7 ? "deactivated" : "active"
    return [name, title, department, manager, "employee", status]
  }),
]

export function emailFor(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .join(".")}@nakheel.sa`
}

export const DEMO_EMPLOYEES: Employee[] = SEEDS.map(
  ([name, jobTitle, departmentId, managerId, role, status], index) => {
    const isMe = name === DEMO_USER.name
    return {
      id: isMe ? DEMO_USER.id : `e-${index + 1}`,
      name,
      email: isMe ? DEMO_USER.email : emailFor(name),
      code: isMe
        ? DEMO_USER.employeeCode
        : `NT-${String(index + 1).padStart(4, "0")}`,
      jobTitle,
      departmentId,
      // Sara is "e-2" in the seeds; her reports point at her real id.
      managerId: managerId === "e-2" ? DEMO_USER.id : managerId,
      role,
      status,
      joinedOn: isMe
        ? DEMO_USER.joinedOn
        : (`20${19 + (index % 7)}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}` as PlainDate),
      pendingRequests: status === "active" ? index % 3 : 0,
      upcomingLeaveDays: status === "active" ? (index * 2) % 5 : 0,
    }
  }
)

// Tracked leave types from FE-04 and their allowances (BE-08 serves the ledger).
const ALLOWANCES = { annual: 21, sick: 30, emergency: 3 } as const

export const DEMO_LEDGER: LedgerEntry[] = DEMO_EMPLOYEES.flatMap(
  (employee, index) => {
    const base = Object.entries(ALLOWANCES).map(
      ([leaveTypeId, amount]): LedgerEntry => ({
        id: `${employee.id}-${leaveTypeId}-allowance`,
        employeeId: employee.id,
        leaveTypeId,
        date: "2026-01-01",
        type: "allowance",
        details: "2026 allowance",
        amount,
      })
    )
    const taken = (index % 4) + 1
    return [
      ...base,
      {
        id: `${employee.id}-annual-1`,
        employeeId: employee.id,
        leaveTypeId: "annual",
        date: "2026-03-08",
        type: "deduction",
        details: `Annual leave · request #${1000 + index}`,
        href: `/requests/${1000 + index}`,
        amount: -taken,
      },
      ...(index % 3 === 0
        ? [
            {
              id: `${employee.id}-annual-2`,
              employeeId: employee.id,
              leaveTypeId: "annual",
              date: "2026-10-25",
              type: "reservation",
              details: `Annual leave · request #${1100 + index}`,
              href: `/requests/${1100 + index}`,
              amount: -2,
            } satisfies LedgerEntry,
          ]
        : []),
    ]
  }
)

export const DEMO_HISTORY: EmployeeChange[] = DEMO_EMPLOYEES.map(
  (employee) => ({
    id: `${employee.id}-created`,
    employeeId: employee.id,
    action: "created",
    actor: DEMO_USER.name,
    at: `${employee.joinedOn}T06:00:00Z`,
    fields: [],
  })
)
