"use server"

import { refresh } from "next/cache"

import { api, attempt } from "@/lib/api"

import type { RequestBody } from "./rules"

/** Either way the page re-renders with the answer, so it shows where the request stands. */
async function post(path: string, body: object = {}) {
  const problem = await attempt(() => api(path, { method: "POST", body }))
  refresh()
  return problem
}

/** Own pending request. */
export async function withdrawRequest(id: string) {
  return post(`/requests/${id}/withdraw`)
}

/** Own approved request that hasn't started; the approver decides. */
export async function requestCancellation(id: string) {
  return post(`/requests/${id}/cancellation`)
}

/** Admin: cancels an approved request at once, with a reason. */
export async function cancelRequest(id: string, reason = "") {
  return post(`/requests/${id}/cancel`, { reason })
}

/** Admins may file for someone else (`employeeId`), and record it as approved. */
export async function submitRequest(
  body: RequestBody & { employeeId?: string; approved?: boolean }
) {
  let id = ""
  const problem = await attempt(async () => {
    ;({ id } = await api<{ id: string }>("/requests", { method: "POST", body }))
  })
  return problem ? { problem } : { id }
}
