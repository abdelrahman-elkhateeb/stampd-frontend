"use server"

import { refresh } from "next/cache"

import { api, attempt } from "@/lib/api"

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
