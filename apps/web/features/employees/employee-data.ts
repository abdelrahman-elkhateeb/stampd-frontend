import { notFound } from "next/navigation"
import { z } from "zod"

import { one } from "@/lib/format"
import { api } from "@/lib/api"
import { getHistory, type Change } from "@/lib/history"
import { toRole, type MeResponse, type Role } from "@/lib/user"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import type { LeaveIconKey } from "@workspace/ui/components/icon-picker"
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "@workspace/ui/components/status-chip"

import type { LedgerEntryType } from "./rules"

export type Department = { id: string; name: string; employeeCount: number }

type Ref = { id: string; name: string }

/** GET /employees/{id} as the API sends it (BE-06). */
type ApiEmployee = {
  id: string
  name: string
  email: string
  phone: string | null
  jobTitle: string | null
  employeeCode: string | null
  department: Ref | null
  manager: Ref | null
  role: MeResponse["role"]
  status: "INVITED" | "ACTIVE" | "DEACTIVATED"
  joiningDate: PlainDate | null
  employmentType: string
  tracksAttendance: boolean
  lastWorkingDay: PlainDate | null
  photoUrl: string | null
}

export type Employee = {
  id: string
  name: string
  email: string
  phone: string
  jobTitle: string
  code: string
  department: Ref | null
  manager: Ref | null
  role: Role
  status: AccountStatus
  joinedOn: PlainDate | null
  employmentType: string
  tracksAttendance: boolean
  lastWorkingDay: PlainDate | null
  photoUrl: string | null
}

const toEmployee = (employee: ApiEmployee): Employee => ({
  id: employee.id,
  name: employee.name,
  email: employee.email,
  phone: employee.phone ?? "",
  jobTitle: employee.jobTitle ?? "",
  code: employee.employeeCode ?? "",
  department: employee.department,
  manager: employee.manager,
  role: toRole(employee.role),
  status: employee.status.toLowerCase() as AccountStatus,
  joinedOn: employee.joiningDate,
  employmentType: employee.employmentType,
  tracksAttendance: employee.tracksAttendance,
  lastWorkingDay: employee.lastWorkingDay,
  photoUrl: employee.photoUrl,
})

export async function getDepartments() {
  const { items } = await api<{ items: Department[] }>("/departments")
  return items
}

/** The list's URL (?q=&dept=&status=&sort=&page=&size=), as the page receives it. */
export type EmployeeSearchParams = Record<string, string | string[] | undefined>

/** GET /employees with the list's filters; the server searches, sorts and pages. */
export async function getEmployees(query: EmployeeSearchParams) {
  const params = new URLSearchParams({
    page: String(Math.max(Number(one(query.page)) || 1, 1)),
    pageSize: String(Math.min(Number(one(query.size)) || 25, 100)),
    sort: one(query.sort) || "name",
  })
  const search = one(query.q)?.trim()
  if (search) params.set("search", search.slice(0, 100))
  const dept = one(query.dept)
  if (dept && z.uuid().safeParse(dept).success) params.set("departmentId", dept)
  for (const status of (one(query.status) ?? "").split(","))
    if ((ACCOUNT_STATUSES as readonly string[]).includes(status))
      params.append("status", status.toUpperCase())
  const { items, meta } = await api<{
    items: ApiEmployee[]
    meta: { totalItems: number }
  }>(`/employees?${params}`)
  return { rows: items.map(toEmployee), total: meta.totalItems }
}

export type PersonOption = { id: string; name: string; jobTitle: string }

/** Who can be someone's manager: active Managers and Admins. ponytail: first 100. */
export async function getManagerOptions(): Promise<PersonOption[]> {
  const { items } = await api<{ items: ApiEmployee[] }>(
    "/employees?status=ACTIVE&role=MANAGER&role=ADMIN&pageSize=100&sort=name"
  )
  return items.map(({ id, name, jobTitle }) => ({
    id,
    name,
    jobTitle: jobTitle ?? "",
  }))
}

export async function getEmployee(id: string) {
  // The API answers 400 to a malformed id; to the reader it's just not there.
  if (!z.uuid().safeParse(id).success) notFound()
  return toEmployee(await api<ApiEmployee>(`/employees/${id}`))
}

/** One leave type's balance for a leave year (BE-08); untracked types have nulls. */
export type Balance = {
  leaveType: { id: string; name: string; icon: LeaveIconKey }
  year: number
  tracked: boolean
  entitlement: number
  adjustments: number
  used: number
  upcoming: number
  pending: number
  available: number
}

type ApiBalance = Omit<
  Balance,
  "entitlement" | "adjustments" | "used" | "upcoming" | "pending" | "available"
> & {
  entitlement: number | null
  adjustments: number | null
  used: number | null
  upcoming: number | null
  pending: number | null
  available: number | null
}

const toBalance = (balance: ApiBalance): Balance => ({
  leaveType: balance.leaveType,
  year: balance.year,
  tracked: balance.tracked,
  entitlement: balance.entitlement ?? 0,
  adjustments: balance.adjustments ?? 0,
  used: balance.used ?? 0,
  upcoming: balance.upcoming ?? 0,
  pending: balance.pending ?? 0,
  available: balance.available ?? 0,
})

/** The current leave year's balances, every type (self / team / company). */
export async function getBalances(employeeId: string) {
  const { items } = await api<{ items: ApiBalance[] }>(
    `/leave/employees/${employeeId}/balances`
  )
  return items.map(toBalance)
}

export type LedgerEntry = {
  id: string
  type: LedgerEntryType
  /** Signed: what the entry does to the available days. */
  amount: number
  requestId: string | null
  reason: string | null
  actor: string | null
  at: string
}

type ApiLedgerEntry = {
  id: string
  type: Uppercase<LedgerEntryType>
  days: number
  requestId: string | null
  reason: string | null
  actor: { type: "USER"; name?: string | null } | { type: "SYSTEM" }
  at: string
}

// ALLOWANCE and ADJUSTMENT come signed; the others are positive amounts.
const TAKES = new Set(["RESERVATION", "DEDUCTION"])

/** One balance's ledger, oldest first. ponytail: first 100 entries of the year. */
export async function getLedger(
  employeeId: string,
  leaveTypeId: string
): Promise<LedgerEntry[]> {
  const { items } = await api<{ items: ApiLedgerEntry[] }>(
    `/leave/employees/${employeeId}/balances/${leaveTypeId}/entries?pageSize=100&sort=at`
  )
  return items.map((entry) => ({
    id: entry.id,
    type: entry.type.toLowerCase() as LedgerEntryType,
    amount: TAKES.has(entry.type) ? -entry.days : entry.days,
    requestId: entry.requestId,
    reason: entry.reason,
    actor: entry.actor.type === "USER" ? (entry.actor.name ?? null) : null,
    at: entry.at,
  }))
}

export type EmployeeChange = Change

/** The employee record's changes, newest first. */
export const getEmployeeHistory = (employeeId: string) =>
  getHistory("employees", employeeId)
