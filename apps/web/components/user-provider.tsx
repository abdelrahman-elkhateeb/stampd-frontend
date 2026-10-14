"use client"

import { createContext, use } from "react"

import type { User } from "@/lib/user"

const UserContext = createContext<User | null>(null)

/** (app)/layout.tsx passes in getMe(); client components read it with useUser(). */
export function UserProvider({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  return <UserContext value={user}>{children}</UserContext>
}

export function useUser() {
  const user = use(UserContext)
  if (!user) throw new Error("useUser() needs a <UserProvider> above it")
  return user
}
