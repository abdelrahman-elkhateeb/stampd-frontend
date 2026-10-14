import { api } from "@/lib/api"
import type { PlainDate } from "@workspace/ui/components/date-picker"

/** The HR record fields the profile shows on top of the signed-in user. */
export type Profile = {
  phone: string
  jobTitle: string
  employeeCode: string
  department: string
  manager: string
  joinedOn?: PlainDate
  photoUrl?: string
}

/** GET /employees/{id}, the fields the profile reads. */
type EmployeeResponse = {
  phone: string | null
  jobTitle: string | null
  employeeCode: string | null
  department: { name: string } | null
  manager: { name: string } | null
  joiningDate: PlainDate | null
  photoUrl: string | null
}

/** Server only. Every role may read their own employee record. */
export async function getProfile(employeeId: string): Promise<Profile> {
  const employee = await api<EmployeeResponse>(`/employees/${employeeId}`)
  return {
    phone: employee.phone ?? "",
    jobTitle: employee.jobTitle ?? "",
    employeeCode: employee.employeeCode ?? "",
    department: employee.department?.name ?? "",
    manager: employee.manager?.name ?? "",
    joinedOn: employee.joiningDate ?? undefined,
    // A signed /files/… path; next.config.ts forwards it to the API.
    photoUrl: employee.photoUrl ?? undefined,
  }
}
