"use server"

import { cookies } from "next/headers"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"
import { toApiError, type ApiFieldError } from "@/lib/api-error"
import {
  clearSession,
  REFRESH_COOKIE,
  saveSession,
  type Tokens,
} from "@/lib/session"

import { authPost } from "./auth-api"

// ponytail: placeholder until the legal documents exist (/terms, /privacy); bump it with them.
const TERMS_VERSION = "2026-10"

/** What a form shows when an action fails. Success returns undefined. */
export type AuthProblem = { code: string; fieldErrors: ApiFieldError[] }

async function toProblem(response: Response): Promise<AuthProblem> {
  const { code, fieldErrors } = await toApiError(response)
  return { code, fieldErrors }
}

/** Token responses: keep the session in cookies, or hand back the problem. */
async function startSession(response: Response) {
  if (!response.ok) return toProblem(response)
  await saveSession((await response.json()) as Tokens)
}

export async function login(input: { email: string; password: string }) {
  return startSession(
    await authPost("/auth/login", {
      email: input.email,
      password: input.password,
    })
  )
}

export async function signup(input: {
  companyName: string
  name: string
  email: string
  password: string
  timezone: string
  terms: boolean
}) {
  return startSession(
    await authPost("/auth/signup", {
      companyName: input.companyName,
      name: input.name,
      email: input.email,
      password: input.password,
      timezone: input.timezone,
      acceptTerms: input.terms,
      termsVersion: TERMS_VERSION,
      locale: await getLocale(),
    })
  )
}

export async function acceptInvite(
  token: string,
  input: { name: string; password: string }
) {
  return startSession(
    await authPost("/auth/invitations/accept", {
      token,
      name: input.name,
      password: input.password,
    })
  )
}

/** The API answers 202 whether or not the account exists. */
export async function forgotPassword(email: string) {
  const response = await authPost("/auth/password/forgot", { email })
  if (!response.ok) return toProblem(response)
}

/** Also ends every other session of the user. */
export async function resetPassword(token: string, password: string) {
  return startSession(
    await authPost("/auth/password/reset", { token, password })
  )
}

export async function logout() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value
  // Best effort: the cookies go even if the API can't be reached.
  if (refreshToken) await authPost("/auth/logout", { refreshToken })
  await clearSession()
  redirect({ href: "/login", locale: await getLocale() })
}
