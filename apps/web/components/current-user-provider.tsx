"use client"

import { createContext, use } from "react"

import type { CurrentUser, Role } from "@/api/generated/model"

const CurrentUserContext = createContext<CurrentUser | null>(null)

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUser
  children: React.ReactNode
}) {
  return <CurrentUserContext value={user}>{children}</CurrentUserContext>
}

export function useCurrentUser(): CurrentUser {
  const user = use(CurrentUserContext)
  if (!user) {
    throw new Error(
      "useCurrentUser must be used inside the signed-in app layout"
    )
  }
  return user
}

/** For hiding UI only. The API is the real gate: it answers 403 regardless. */
export function useHasRole(...roles: Role[]) {
  return roles.includes(useCurrentUser().role)
}
