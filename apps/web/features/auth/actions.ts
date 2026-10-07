"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"

import { login, logout } from "@/api/generated/server/auth/auth"
import { LoginBody } from "@/api/generated/zod/auth/auth"
import type { LoginRequest } from "@/api/generated/model"
import {
  clearSessionCookies,
  REFRESH_COOKIE,
  writeSessionCookies,
} from "@/lib/auth/cookies"
import { routing } from "@/i18n/routing"
import { inLocale, safeReturnTo } from "@/lib/auth/return-to"
import {
  apiToFormErrors,
  codeErrorMap,
  zodToFormErrors,
  type FormErrors,
} from "@/lib/forms"

export type LoginResult = FormErrors<LoginRequest>

/** Same schema as the form (generated from the contract), checked again on the server. */
export async function loginAction(
  input: LoginRequest,
  returnTo?: string
): Promise<LoginResult> {
  const parsed = LoginBody.safeParse(input, codeErrorMap)
  if (!parsed.success) {
    return zodToFormErrors(parsed.error)
  }

  let tokens
  try {
    tokens = await login(parsed.data, { authErrors: "throw" })
  } catch (error) {
    return apiToFormErrors(error)
  }

  writeSessionCookies(await cookies(), tokens)
  const locale = await getLocale()
  redirect(
    inLocale(safeReturnTo(returnTo, `/${locale}`), locale, routing.locales)
  )
}

export async function logoutAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    // Best effort: the session ends locally even if the API can't be reached.
    await logout({ refreshToken }, { authErrors: "throw" }).catch(
      () => undefined
    )
  }
  clearSessionCookies(cookieStore)
  redirect(`/${await getLocale()}/login`)
}
