import type { Role } from "@/lib/user"
import type { PlainDate, Weekday } from "@workspace/ui/components/date-picker"

// ponytail: feature demo data still reads this user; each screen moves to useUser()/getMe() when it's wired to the API.
export const DEMO_USER = {
  id: "u-sara",
  name: "Sara Al-Harbi",
  email: "sara@demo.stampd.app",
  phone: "+966 55 123 4567",
  jobTitle: "HR Manager",
  department: "People Operations",
  manager: "Khalid Al-Otaibi",
  employeeCode: "NT-0042",
  joinedOn: "2022-03-14" as PlainDate,
  // Admin sees every nav section; change it to preview the other roles.
  role: "admin" as Role,
  company: {
    id: "c-nakheel",
    name: "Nakheel Trading",
    timezone: "Asia/Riyadh",
    weekStart: 0 as Weekday,
    // The GCC week: Sunday to Thursday.
    workingDays: [0, 1, 2, 3, 4] as Weekday[],
  },
}
