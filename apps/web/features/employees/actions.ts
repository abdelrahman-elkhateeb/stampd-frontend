"use server"

import { refresh } from "next/cache"

import { api, attempt, mutate } from "@/lib/api"

export type EmployeeBody = {
  name: string
  email: string
  jobTitle: string | null
  employeeCode: string | null
  departmentId: string | null
  managerId: string | null
  role: "EMPLOYEE" | "MANAGER" | "ADMIN"
  joiningDate: string
}

/** A new employee is invited by email at once (BE-06). */
export async function createEmployee(body: EmployeeBody) {
  return mutate("/employees", { method: "POST", body })
}

export async function updateEmployee(id: string, body: Partial<EmployeeBody>) {
  return mutate(`/employees/${id}`, { method: "PATCH", body })
}

export async function resendInvite(id: string) {
  return mutate(`/employees/${id}/invitation`, { method: "POST" })
}

export type DeactivationImpact = {
  lastWorkingDay: string
  directReports: { id: string; name: string }[]
  pendingRequests: { id: string; type: string }[]
  futureApprovedTimeOff: { id: string; type: string }[]
}

/** Changes nothing: what deactivating on that day would do. */
export async function previewDeactivation(id: string, lastWorkingDay: string) {
  let impact: DeactivationImpact | undefined
  const problem = await attempt(async () => {
    impact = await api<DeactivationImpact>(
      `/employees/${id}/deactivation/preview`,
      { method: "POST", body: { lastWorkingDay } }
    )
  })
  return problem ? { problem } : { impact: impact! }
}

/** Direct reports move to `reassignReportsTo` first (409 HAS_DIRECT_REPORTS otherwise). */
export async function deactivate(
  id: string,
  body: { lastWorkingDay: string; reassignReportsTo?: string }
) {
  return mutate(`/employees/${id}/deactivation`, { method: "POST", body })
}

export async function reactivate(id: string) {
  return mutate(`/employees/${id}/reactivation`, { method: "POST" })
}

/** ± days with a required reason; the ledger records it. */
export async function adjustBalance(
  employeeId: string,
  leaveTypeId: string,
  body: { days: number; reason: string }
) {
  return mutate(
    `/leave/employees/${employeeId}/balances/${leaveTypeId}/adjustments`,
    { method: "POST", body }
  )
}

export async function saveDepartment(name: string, id?: string) {
  return mutate(id ? `/departments/${id}` : "/departments", {
    method: id ? "PATCH" : "POST",
    body: { name },
  })
}

/** 409 DEPARTMENT_NOT_EMPTY while anyone is in it. */
export async function deleteDepartment(id: string) {
  return mutate(`/departments/${id}`, { method: "DELETE" })
}

export type ImportOutcome = {
  createdCount: number
  created: { id: string; name: string; email: string }[]
  /** `row` is the line in the file (the header is line 1). */
  errors: { row: number; field: string; code: string; message: string }[]
}

/** Valid rows are created and invited one by one; invalid rows come back as errors. */
export async function importEmployees(csv: string) {
  let outcome: ImportOutcome | undefined
  const problem = await attempt(async () => {
    outcome = await api<ImportOutcome>("/employees/import", {
      method: "POST",
      body: new Blob([csv], { type: "text/csv" }),
    })
  })
  if (problem) return { problem }
  refresh()
  return { outcome: outcome! }
}
