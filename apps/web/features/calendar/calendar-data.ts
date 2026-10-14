import { addDays } from "@/features/attendance/rules"
import { api } from "@/lib/api"
import type { PlainDate } from "@workspace/ui/components/date-picker"

/** GET /calendar/events (BE-12): what the caller may see, already privacy-filtered. */
export type CalendarEvent =
  | {
      kind: "HOLIDAY"
      id: string
      name: string
      startDate: PlainDate
      endDate: PlainDate
    }
  | {
      kind: "LEAVE" | "WFH" | "BUSINESS_TRIP" | "PERMISSION"
      requestId: string
      tentative: boolean
      employee: { id: string; name: string }
      startDate: PlainDate
      endDate: PlainDate
      startTime: string | null
      endTime: string | null
      leaveType?: { id: string; name: string } | null
    }
  | {
      /** A colleague: name and OUT / WFH only. */
      kind: "OUT" | "WFH"
      colleague: true
      employee: { id: string; name: string }
      startDate: PlainDate
      endDate: PlainDate
    }

export type DayAvailability = {
  date: PlainDate
  working: boolean
  holiday: string | null
  total: number
  out: number
  wfh: number
  inOffice: number
}

/** A month's events and per-day counts. `team` = the caller's direct reports only. */
export async function getCalendar(
  month: string,
  filters: { pending: boolean; team: boolean }
) {
  const from = `${month}-01` as PlainDate
  const to = addDays(`${addDays(from, 31).slice(0, 7)}-01` as PlainDate, -1)
  const params = new URLSearchParams({ from, to })
  if (filters.team) params.set("team", "true")
  const events = new URLSearchParams(params)
  if (filters.pending) events.set("includePending", "true")
  const [eventsResult, availabilityResult] = await Promise.all([
    api<{ events: CalendarEvent[] }>(`/calendar/events?${events}`),
    api<{ days: DayAvailability[] }>(`/calendar/availability?${params}`),
  ])
  return { events: eventsResult.events, days: availabilityResult.days }
}
