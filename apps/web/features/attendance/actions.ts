"use server"

import { refresh } from "next/cache"

import { api, attempt } from "@/lib/api"

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
