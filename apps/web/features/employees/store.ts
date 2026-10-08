"use client"

import { useSyncExternalStore } from "react"

import { DEMO_USER } from "@/lib/demo-user"

import {
  DEMO_DEPARTMENTS,
  DEMO_EMPLOYEES,
  DEMO_HISTORY,
  DEMO_LEDGER,
  type Department,
  type Employee,
  type EmployeeChange,
  type LedgerEntry,
} from "./demo-data"

export type EmployeesState = {
  employees: Employee[]
  departments: Department[]
  ledger: LedgerEntry[]
  history: EmployeeChange[]
}

// ponytail: an in-memory store so the list, detail, departments and import screens share
// edits until BE-06; swap for API queries then. Resets on reload.
const INITIAL: EmployeesState = {
  employees: DEMO_EMPLOYEES,
  departments: DEMO_DEPARTMENTS,
  ledger: DEMO_LEDGER,
  history: DEMO_HISTORY,
}
let state = INITIAL
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useEmployeesStore() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL
  )
}

export function updateStore(
  change: (current: EmployeesState) => EmployeesState
) {
  state = change(state)
  listeners.forEach((listener) => listener())
}

/** A history entry by the signed-in admin, now. */
export function change(
  employeeId: string,
  action: EmployeeChange["action"],
  fields: EmployeeChange["fields"] = [],
  reason?: string
): EmployeeChange {
  return {
    id: crypto.randomUUID(),
    employeeId,
    action,
    actor: DEMO_USER.name,
    at: new Date().toISOString(),
    fields,
    reason,
  }
}
