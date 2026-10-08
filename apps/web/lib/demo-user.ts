import type { Weekday } from "@workspace/ui/components/date-picker"

export type Role = "employee" | "manager" | "admin"

// ponytail: static stand-in until the backend serves GET /me; swap for the real user then.
export const DEMO_USER = {
  id: "u-sara",
  name: "Sara Al-Harbi",
  email: "sara@demo.stampd.app",
  // Admin sees every nav section; change it to preview the other roles.
  role: "admin" as Role,
  company: {
    name: "Nakheel Trading",
    timezone: "Asia/Riyadh",
    weekStart: 0 as Weekday,
    // The GCC week: Sunday to Thursday.
    workingDays: [0, 1, 2, 3, 4] as Weekday[],
  },
  // ponytail: fixed counts until the dashboard summary and bell poll exist (FE-10, FE-15).
  counts: { approvals: 7, notifications: 3 },
}
