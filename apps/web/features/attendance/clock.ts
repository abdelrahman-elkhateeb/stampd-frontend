"use client"

import { useState, useSyncExternalStore } from "react"

function subscribeMinute(listener: () => void) {
  const id = setInterval(listener, 1000)
  return () => clearInterval(id)
}

/**
 * The server clock, ticking once a minute (formatting.md › live counters). `serverNow` is
 * Date.now() on the server at render; the device clock only measures time since then.
 */
export function useNow(serverNow: number) {
  const [offset] = useState(() => serverNow - Date.now())
  return useSyncExternalStore(
    subscribeMinute,
    () => Math.floor((Date.now() + offset) / 60_000) * 60_000,
    () => null
  )
}
