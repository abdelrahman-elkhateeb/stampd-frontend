"use server"

import { api, getMe } from "@/lib/api"
import { ApiError, type Problem } from "@/lib/api-error"

/** API errors come back as a Problem (success: undefined); redirects (401) still throw. */
async function attempt(
  call: () => Promise<unknown>
): Promise<Problem | undefined> {
  try {
    await call()
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    return { code: error.code, fieldErrors: error.fieldErrors }
  }
}

/** Other sessions end; this one stays signed in. */
export async function changePassword(input: {
  current: string
  password: string
}) {
  return attempt(() =>
    api("/me/password", {
      method: "POST",
      body: { currentPassword: input.current, newPassword: input.password },
    })
  )
}

export async function savePhone(phone: string) {
  const me = await getMe()
  return attempt(() =>
    api(`/employees/${me.id}`, { method: "PATCH", body: { phone } })
  )
}

/** FormData `file`, sent raw; the API checks type and size by content (≤ 2 MB). */
export async function uploadPhoto(data: FormData) {
  const me = await getMe()
  const file = data.get("file")
  if (!(file instanceof Blob))
    return { problem: { code: "REQUIRED", fieldErrors: [] } }
  let photoUrl = ""
  const problem = await attempt(async () => {
    ;({ photoUrl } = await api<{ photoUrl: string }>(
      `/employees/${me.id}/photo`,
      { method: "PUT", body: file }
    ))
  })
  return problem ? { problem } : { photoUrl }
}

export async function removePhoto() {
  const me = await getMe()
  return attempt(() => api(`/employees/${me.id}/photo`, { method: "DELETE" }))
}
