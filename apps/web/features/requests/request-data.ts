import { notFound } from "next/navigation"
import { z } from "zod"

import { getLeaveTypes } from "@/features/settings/settings-data"
import { api } from "@/lib/api"
import { isPlainDate, one } from "@/lib/format"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import {
  REQUEST_STATUSES,
  type RequestStatus,
} from "@workspace/ui/components/status-chip"

/** A type's own field (`data.<name>`), as GET /requests/types describes it. */
export type TypeField = {
  name: string
  kind: "text" | "time" | "choice" | "leaveType" | (string & {})
  required: boolean
  maxLength?: number
  options?: string[]
}

/** GET /requests/types. Labels are English only: the app translates by key. */
export type RequestType = {
  key: string
  label: string
  enabled: boolean
  approverPolicy: "MANAGER_WITH_ADMIN_FALLBACK" | "ADMIN_ONLY"
  dates: "SINGLE_DAY" | "RANGE"
  times: "NONE" | "OPTIONAL" | "REQUIRED"
  reason: "OPTIONAL" | "REQUIRED"
  fields: TypeField[]
}

type ApiStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "CANCELLATION_REQUESTED"
  | "CANCELLED"

type Person = { id: string; name: string | null }

/** One request, as lists and the detail return it; `status` already in app form. */
export type Request = {
  id: string
  type: string
  requester: Person
  startDate: PlainDate
  endDate: PlainDate
  startTime: string | null
  endTime: string | null
  reason: string | null
  data: Record<string, unknown>
  status: RequestStatus
  approverPolicy: RequestType["approverPolicy"] | null
  createdBy: Person
  submittedAt: string | null
  decision: { by: Person; at: string | null; comment: string | null } | null
  /** WITHDRAW, REQUEST_CANCELLATION, CANCEL, APPROVE, …: what the viewer may do now. */
  actions: string[]
}

export type TimelineEntry = {
  status: RequestStatus | null
  previousStatus: RequestStatus | null
  actor: { type: "USER"; name: string | null } | { type: "SYSTEM" }
  reason: string | null
  at: string
}

export type RequestDetail = Request & { timeline: TimelineEntry[] }

export type LeaveTypeName = { id: string; name: string }

export const toStatus = (status: ApiStatus): RequestStatus =>
  status === "CANCELLATION_REQUESTED"
    ? "cancel-requested"
    : (status.toLowerCase() as RequestStatus)

const toApiStatus = (status: RequestStatus) =>
  status === "cancel-requested"
    ? "CANCELLATION_REQUESTED"
    : status.toUpperCase()

type ApiRequest = Omit<Request, "status"> & { status: ApiStatus }
type ApiTimelineEntry = Omit<TimelineEntry, "status" | "previousStatus"> & {
  status: ApiStatus | null
  previousStatus: ApiStatus | null
}

const fromApi = (request: ApiRequest): Request => ({
  ...request,
  status: toStatus(request.status),
})

/** Server only. Admins also get turned-off types (old requests still need their labels). */
export async function getRequestTypes() {
  const { items } = await api<{ items: RequestType[] }>(
    "/requests/types?includeDisabled=true"
  )
  return items
}

/** Names for leave requests' `leaveTypeId`, archived ones included. */
export async function getLeaveTypeNames(): Promise<LeaveTypeName[]> {
  return (await getLeaveTypes()).map(({ id, name }) => ({ id, name }))
}

/** The list filters as the URL has them (nuqs: comma-separated arrays). */
export type RequestQuery = {
  type?: string | string[]
  status?: string | string[]
  from?: string | string[]
  to?: string | string[]
}

const list = (value: string | string[] | undefined) =>
  (one(value) ?? "").split(",").filter(Boolean)

/** GET /requests/mine, newest first. A date filter keeps requests that overlap it. */
export async function getMyRequests(query: RequestQuery) {
  const params = new URLSearchParams({ pageSize: "100" })
  for (const type of list(query.type)) params.append("type", type)
  for (const status of list(query.status))
    if ((REQUEST_STATUSES as readonly string[]).includes(status))
      params.append("status", toApiStatus(status as RequestStatus))
  const from = one(query.from)
  const to = one(query.to)
  if (from && to && isPlainDate(from) && isPlainDate(to)) {
    params.set("from", from)
    params.set("to", to)
  }
  // ponytail: first 100 only; add paging when someone has more.
  const { items } = await api<{ items: ApiRequest[] }>(
    `/requests/mine?${params}`
  )
  return items.map(fromApi)
}

/** GET /requests/{id}; one the viewer can't see is a 404 (the not-found page). */
export async function getRequest(id: string): Promise<RequestDetail> {
  // The API answers 400 to a malformed id; to the reader it's just not there.
  if (!z.uuid().safeParse(id).success) notFound()
  const detail = await api<ApiRequest & { timeline: ApiTimelineEntry[] }>(
    `/requests/${id}`
  )
  return {
    ...fromApi(detail),
    timeline: detail.timeline.map((entry) => ({
      ...entry,
      status: entry.status && toStatus(entry.status),
      previousStatus: entry.previousStatus && toStatus(entry.previousStatus),
    })),
  }
}

export type EmployeeOption = {
  id: string
  name: string
  jobTitle: string | null
}

/** Admin only: who a request can be filed for. ponytail: first 100; search when companies grow. */
export async function getActiveEmployees(): Promise<EmployeeOption[]> {
  const { items } = await api<{ items: EmployeeOption[] }>(
    "/employees?status=ACTIVE&pageSize=100"
  )
  return items.map(({ id, name, jobTitle }) => ({ id, name, jobTitle }))
}

/** GET /leave/employees/{id}/requests: leave only, newest first. ponytail: first 100. */
export async function getLeaveRequests(employeeId: string) {
  const { items } = await api<{ items: ApiRequest[] }>(
    `/leave/employees/${employeeId}/requests?pageSize=100`
  )
  return items.map(fromApi)
}

const WAITING = ["PENDING", "CANCELLATION_REQUESTED"]
const DECIDED = ["APPROVED", "REJECTED", "CANCELLED"]

/**
 * GET /requests/approvals: what the caller decides on (never their own). "pending" is the
 * inbox, oldest first; "decided" is the latest decisions. ponytail: first 100.
 */
export async function getApprovals(tab: "pending" | "decided") {
  const params = new URLSearchParams({
    pageSize: "100",
    sort: tab === "pending" ? "createdAt" : "-createdAt",
  })
  for (const status of tab === "pending" ? WAITING : DECIDED)
    params.append("status", status)
  const { items } = await api<{ items: ApiRequest[] }>(
    `/requests/approvals?${params}`
  )
  return items.map(fromApi)
}

/** The nav badge: requests waiting for the caller. */
export async function countApprovals() {
  const params = new URLSearchParams({ pageSize: "1" })
  for (const status of WAITING) params.append("status", status)
  const { meta } = await api<{ meta: { totalItems: number } }>(
    `/requests/approvals?${params}`
  )
  return meta.totalItems
}
