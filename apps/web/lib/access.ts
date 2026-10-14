import type { Role } from "@/lib/user"

/** The path itself or anything under it: "/team" matches "/team/42", not "/teams". */
export function matchesPath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`)
}

// Routes outside the "Me" section. Everything else is open to every signed-in user.
// Navigation visibility is a convenience; the server enforces access (BE-03).
const RESTRICTED: [href: string, roles: Role[]][] = [
  ["/approvals", ["manager", "admin"]],
  ["/team", ["manager", "admin"]],
  ["/employees", ["admin"]],
  ["/attendance-review", ["admin"]],
  ["/reports", ["admin"]],
  ["/settings", ["admin"]],
]

/** Who may open the path; undefined means every signed-in user. */
export function rolesFor(pathname: string) {
  return RESTRICTED.find(([href]) => matchesPath(pathname, href))?.[1]
}

export function canAccess(role: Role, pathname: string) {
  const roles = rolesFor(pathname)
  return !roles || roles.includes(role)
}
