import { useSyncExternalStore } from "react"

const noSubscribe = () => () => {}
let cachedZones: string[] | undefined

// Node and the browser can list different zones, so the full list is client-only,
// with the browser's own zone first.
function browserZones() {
  if (!cachedZones) {
    const own = Intl.DateTimeFormat().resolvedOptions().timeZone
    cachedZones = [
      own,
      ...Intl.supportedValuesOf("timeZone").filter((zone) => zone !== own),
    ]
  }
  return cachedZones
}

/** Every IANA zone, browser zone first; `serverZones` until hydrated. */
export function useTimeZones(serverZones: string[]) {
  return useSyncExternalStore(noSubscribe, browserZones, () => serverZones)
}
