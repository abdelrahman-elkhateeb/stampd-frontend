"use client"

import { useSyncExternalStore } from "react"

import {
  SERVER_TIME_OFFSET_MS,
  companyToday,
  demoHistory,
  demoRules,
  type DayRecord,
} from "./demo-data"
import { checkIn, checkOut } from "./rules"

// ponytail: an in-memory store until BE-07; swap for GET /attendance + POST check-in/out
// (with an idempotency key) then. Built on first use in the browser; resets on reload.
let records: DayRecord[] | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot() {
  records ??= demoHistory(demoRules(companyToday(serverNow())))
  return records
}

/** null on the server and during hydration: the day depends on the clock. */
export function useAttendanceRecords() {
  return useSyncExternalStore(subscribe, snapshot, () => null)
}

/** Device time corrected by the server offset; never trust the device clock alone. */
export const serverNow = () => Date.now() + SERVER_TIME_OFFSET_MS

const minute = () => Math.floor(serverNow() / 60_000) * 60_000

function subscribeMinute(listener: () => void) {
  const id = setInterval(listener, 1000)
  return () => clearInterval(id)
}

/** The server clock, ticking once a minute (formatting.md › live counters). */
export function useNow() {
  return useSyncExternalStore(subscribeMinute, minute, () => null)
}

// ponytail: fakes the network round trip; the API decides Present / Late.
async function commit(change: (current: DayRecord[]) => DayRecord[]) {
  await new Promise((resolve) => setTimeout(resolve, 600))
  records = change(snapshot())
  listeners.forEach((listener) => listener())
}

export function checkInNow() {
  const at = new Date(serverNow()).toISOString()
  return commit((current) =>
    checkIn(current, companyToday(serverNow()), at)
  ).then(() => at)
}

export function checkOutNow() {
  const at = new Date(serverNow()).toISOString()
  return commit((current) =>
    checkOut(current, companyToday(serverNow()), at)
  ).then(() => at)
}
