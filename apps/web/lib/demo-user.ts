import type { Weekday } from "@workspace/ui/components/date-picker"

// ponytail: static stand-in until the backend serves GET /me; swap for the real user then.
export const DEMO_USER = {
  name: "Sara Al-Harbi",
  company: {
    timezone: "Asia/Riyadh",
    weekStart: 0 as Weekday,
    // The GCC week: Sunday to Thursday.
    workingDays: [0, 1, 2, 3, 4] as Weekday[],
  },
}
