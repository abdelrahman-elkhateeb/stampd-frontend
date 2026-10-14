"use server"

import { api, attempt } from "@/lib/api"

export type LeavePreviewBody = {
  leaveTypeId: string
  startDate: string
  endDate: string
  firstDayHalf: "MORNING" | "AFTERNOON" | null
  lastDayHalf: "MORNING" | null
  reason: string | null
}

/** POST /leave/requests/preview (BE-10): the same rules as submit, nothing saved. */
export type LeavePreview = {
  days: number
  excluded: {
    date: string
    reason: "WEEKEND" | "HOLIDAY"
    holiday: { name: string } | null
  }[]
  balance: { tracked: boolean; available: number; availableAfter: number }
  problems: { code: string; field: string | null; message: string }[]
  teamOff: {
    employeeId: string
    name: string
    startDate?: string
    endDate?: string
  }[]
}

export async function previewLeave(body: LeavePreviewBody) {
  let preview: LeavePreview | undefined
  const problem = await attempt(async () => {
    preview = await api<LeavePreview>("/leave/requests/preview", {
      method: "POST",
      body,
    })
  })
  return problem ? { problem } : { preview: preview! }
}
