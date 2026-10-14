import type { Weekday } from "@workspace/ui/components/date-picker"

export type Role = "employee" | "manager" | "admin"

/** The signed-in user, as the app uses it. Server and client: no Next imports. */
export type User = {
  id: string
  name: string
  email: string
  role: Role
  company: {
    id: string
    name: string
    timezone: string
    weekStart: Weekday
    workingDays: Weekday[]
  }
}

/** GET /me as the API sends it. */
export type MeResponse = {
  id: string
  name: string
  email: string
  role: "EMPLOYEE" | "MANAGER" | "ADMIN"
  company: {
    id: string
    name: string
    timezone: string
    weekStart: string
    workingDays: string[]
  }
}

export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

export const toWeekday = (code: string) => WEEKDAYS.indexOf(code) as Weekday

export const toRole = (role: MeResponse["role"]) => role.toLowerCase() as Role

export function toUser(me: MeResponse): User {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    role: toRole(me.role),
    company: {
      id: me.company.id,
      name: me.company.name,
      timezone: me.company.timezone,
      weekStart: toWeekday(me.company.weekStart),
      workingDays: me.company.workingDays.map(toWeekday),
    },
  }
}
