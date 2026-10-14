"use server"

import { refresh } from "next/cache"

import { api, attempt } from "@/lib/api"

import type { ApiCompanySettings } from "./settings-data"

type SettingsBody = Partial<
  Omit<ApiCompanySettings, "logoUrl" | "timezoneEffectiveFrom">
>

/** Every write re-renders the page, so it shows what the server now has. */
async function write(path: string, init: { method: string; body?: unknown }) {
  const problem = await attempt(() => api(path, init))
  if (!problem) refresh()
  return problem
}

/** Only the changed fields; a timezone change applies from the company's next day. */
export async function saveSettings(change: SettingsBody) {
  return write("/company/settings", { method: "PATCH", body: change })
}

/** FormData `file`, sent raw; the API checks type (PNG/JPEG/WebP) and size (≤ 2 MB). */
export async function uploadLogo(data: FormData) {
  const file = data.get("file")
  if (!(file instanceof Blob)) return { code: "REQUIRED", fieldErrors: [] }
  return write("/company/logo", { method: "PUT", body: file })
}

export async function removeLogo() {
  return write("/company/logo", { method: "DELETE" })
}

export type HolidayBody = { name: string; startDate: string; endDate: string }

export type AffectedRequest = {
  requestId: string
  employeeId: string
  employeeName: string
  type: string
  startDate: string
  endDate: string
}

/** Returns the approved requests on the holiday's dates (never changed automatically). */
export async function saveHoliday(holiday: HolidayBody, id?: string) {
  let affected: AffectedRequest[] = []
  const problem = await attempt(async () => {
    ;({ affectedRequests: affected } = await api<{
      affectedRequests: AffectedRequest[]
    }>(id ? `/company/holidays/${id}` : "/company/holidays", {
      method: id ? "PATCH" : "POST",
      body: holiday,
    }))
  })
  if (problem) return { problem }
  refresh()
  return { affected }
}

export async function removeHoliday(id: string) {
  return write(`/company/holidays/${id}`, { method: "DELETE" })
}

export type LeaveTypeBody = {
  name: string
  icon: string
  paid: boolean
  tracksBalance: boolean
  defaultAllowanceDays: number
  allowNegativeBalance: boolean
  halfDaysAllowed: boolean
  requiresReason: boolean
  archived?: boolean
}

export async function saveLeaveType(body: Partial<LeaveTypeBody>, id?: string) {
  return write(id ? `/leave/types/${id}` : "/leave/types", {
    method: id ? "PATCH" : "POST",
    body,
  })
}

/** 409 LEAVE_TYPE_IN_USE once a request used it: archive instead. */
export async function deleteLeaveType(id: string) {
  return write(`/leave/types/${id}`, { method: "DELETE" })
}
