"use client"

import { useSyncExternalStore } from "react"

import { companyToday } from "@/features/attendance/demo-data"
import { serverNow } from "@/features/attendance/store"
import { DEMO_USER } from "@/lib/demo-user"

import {
  demoRequests,
  type FieldValue,
  type MyRequest,
  type RequestEvent,
} from "./demo-data"

// ponytail: an in-memory store until BE-09; swap for GET /requests, POST /requests (with an
// idempotency key) and the action endpoints then. Built on first use; resets on reload.
let requests: MyRequest[] | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot() {
  requests ??= demoRequests(today())
  return requests
}

export const today = () => companyToday(serverNow())

/** null on the server and during hydration: the demo data depends on today. */
export function useRequests() {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}

// ponytail: fakes the network round trip.
async function commit(change: (current: MyRequest[]) => MyRequest[]) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  requests = change(snapshot())
  listeners.forEach((listener) => listener())
}

function event(
  kind: RequestEvent["kind"],
  extra: Partial<RequestEvent> = {}
): RequestEvent {
  return {
    id: crypto.randomUUID(),
    kind,
    actor: DEMO_USER.name,
    at: new Date(serverNow()).toISOString(),
    ...extra,
  }
}

export async function submitRequest({
  type,
  values,
  employee,
  approver,
  recordApproved,
}: {
  type: string
  values: Record<string, FieldValue>
  employee: { id: string; name: string }
  approver: string | null
  /** Admin only: "Record as already approved". */
  recordApproved: boolean
}) {
  const id = String(Math.max(0, ...snapshot().map((r) => Number(r.id))) + 1)
  const onBehalfOf = employee.id === DEMO_USER.id ? undefined : employee.name
  await commit((current) => [
    ...current,
    {
      id,
      type,
      employeeId: employee.id,
      employeeName: employee.name,
      approver,
      status: recordApproved ? "approved" : "pending",
      values,
      events: [
        event("submitted", { onBehalfOf }),
        ...(recordApproved ? [event("approved")] : []),
      ],
    },
  ])
  return id
}

const STATUS_AFTER = {
  withdraw: "withdrawn",
  requestCancellation: "cancel-requested",
  adminCancel: "cancelled",
} as const

export function act(
  id: string,
  action: keyof typeof STATUS_AFTER,
  comment?: string
) {
  const status = STATUS_AFTER[action]
  return commit((current) =>
    current.map((request) =>
      request.id === id
        ? {
            ...request,
            status,
            events: [...request.events, event(status, { comment })],
          }
        : request
    )
  )
}
