"use client"

import { useSyncExternalStore } from "react"

import { useFormat } from "@/lib/use-format"

const TICK_MS = 60_000

// One shared clock for every <RelativeTime> on the page, ticking once a minute.
let now = Date.now()
const listeners = new Set<() => void>()
let timer: number | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (timer === undefined) {
    now = Date.now()
    timer = window.setInterval(() => {
      now = Date.now()
      listeners.forEach((notify) => notify())
    }, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.clearInterval(timer)
      timer = undefined
    }
  }
}

/**
 * "3 hr ago", with the full company-time date in a tooltip.
 * The server render shows the absolute date: relative text depends on "now",
 * so it only appears on the client (no hydration mismatch).
 */
export function RelativeTime({ iso }: { iso: string }) {
  const format = useFormat()
  const current = useSyncExternalStore(
    subscribe,
    () => now,
    () => null
  )

  const full = `${format.dateTime(iso, "long")} ${format.time(iso)}`
  return (
    <time dateTime={iso} title={full}>
      {current === null
        ? format.dateTime(iso)
        : format.relative(iso, new Date(current))}
    </time>
  )
}
