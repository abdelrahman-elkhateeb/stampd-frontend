import { api } from "@/lib/api"
import type { PlainDate } from "@workspace/ui/components/date-picker"
import type { LeaveIconKey } from "@workspace/ui/components/icon-picker"

/** Today's buckets (BE-13); on a working day they add up to `expected`. */
export type DayCounts = {
  present: number
  late: number
  absent: number
  wfh: number
  onLeave: number
  businessTrip: number
  notYetCheckedIn: number
}

export type TimeOff = {
  requestId: string
  type: string
  employee: { id: string; name: string }
  startDate: PlainDate
  endDate: PlainDate
}

type Person = { id: string; name: string }

export type ManagerSummary = {
  pendingApprovals: { total: number }
  teamToday: {
    working: boolean
    expected: number
    counts: DayCounts
    people: Record<keyof DayCounts, Person[]>
  }
  teamOutNext14Days: TimeOff[]
  teamThisMonth: { late: number; absences: number; missingCheckouts: number }
}

export type AdminSummary = {
  companyToday: { working: boolean; expected: number; counts: DayCounts }
  pendingRequests: {
    type: string
    count: number
    overdue: number
    oldestAgeDays: number
  }[]
  exceptionsThisMonth: { missingCheckouts: number; absences: number }
  leaveUsage: {
    year: number
    items: {
      leaveType: { id: string; name: string; icon: LeaveIconKey }
      entitled: number
      used: number
      upcoming: number
      pending: number
    }[]
  }
  attendanceTrend: {
    date: PlainDate
    working: boolean
    present: number
    late: number
    absent: number
    wfh: number
  }[]
}

/** The employee summary's parts the dashboard shows (the rest comes from other reads). */
export async function getUpcomingTimeOff() {
  const { upcoming } = await api<{ upcoming: TimeOff[] }>("/dashboard/employee")
  return upcoming
}

export async function getManagerSummary() {
  return api<ManagerSummary>("/dashboard/manager")
}

export async function getAdminSummary() {
  return api<AdminSummary>("/dashboard/admin")
}
