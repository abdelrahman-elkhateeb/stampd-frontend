"use server"

import { refresh } from "next/cache"

import { api, attempt, mutate } from "@/lib/api"

import type { ApiToday } from "./attendance-data"

/** The server stamps the time; the page re-renders with the new day either way. */
async function post(path: string, stamp: "checkInAt" | "checkOutAt") {
  let today: ApiToday | undefined
  const problem = await attempt(async () => {
    today = await api<ApiToday>(path, { method: "POST" })
  })
  refresh()
  if (problem || !today) return { problem }
  return {
    at: today.sessions.at(-1)?.[stamp] ?? new Date().toISOString(),
    late: today.status === "LATE",
  }
}

export async function checkIn() {
  return post("/attendance/check-in", "checkInAt")
}

export async function checkOut() {
  return post("/attendance/check-out", "checkOutAt")
}

// ── HR corrections (FE-11): each change needs a reason, kept in the day's history ──

export async function addSession(
  employeeId: string,
  date: string,
  body: { checkInAt: string; checkOutAt: string; reason: string }
) {
  return mutate(`/attendance/employees/${employeeId}/days/${date}/sessions`, {
    method: "POST",
    body,
  })
}

export async function editSession(
  id: string,
  body: { checkInAt: string; checkOutAt: string | null; reason: string }
) {
  const { checkOutAt, ...rest } = body
  return mutate(`/attendance/sessions/${id}`, {
    method: "PATCH",
    body: { ...rest, ...(checkOutAt && { checkOutAt }) },
  })
}

export async function removeSession(id: string, reason: string) {
  return mutate(`/attendance/sessions/${id}`, {
    method: "DELETE",
    body: { reason },
  })
}
