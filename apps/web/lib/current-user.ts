import "server-only"

import { cache } from "react"

import { getCurrentUser as fetchCurrentUser } from "@/api/generated/server/me/me"
import { GetCurrentUserResponse } from "@/api/generated/zod/me/me"

/**
 * The signed-in user, their role and company basics (timezone, week start).
 * Fetched once per request and validated against the contract, because every
 * business date on the page depends on company.timezone being right.
 * 401 redirects to login and 403 shows the "no access" page (see serverFetch).
 */
export const getCurrentUser = cache(async () => {
  return GetCurrentUserResponse.parse(await fetchCurrentUser())
})
