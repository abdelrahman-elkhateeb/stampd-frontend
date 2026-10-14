import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { ApiError, toApiError } from "@/lib/api-error"
import { secondsLeft } from "@/lib/session"

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}))
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }))
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }))

describe("api", () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubEnv("API_BASE_URL", "http://api.test")
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })
  const sent = () => fetchMock.mock.calls[0]![1] as RequestInit

  it("sends a Blob raw, with its own type", async () => {
    const photo = new Blob(["png"], { type: "image/png" })
    await api("/photo", { method: "PUT", body: photo })
    expect(sent().body).toBe(photo)
    expect(sent().headers).toMatchObject({ "Content-Type": "image/png" })
  })

  it("sends anything else as JSON", async () => {
    await api("/phone", { method: "PATCH", body: { phone: "+1 555" } })
    expect(sent().body).toBe('{"phone":"+1 555"}')
    expect(sent().headers).toMatchObject({
      "Content-Type": "application/json",
    })
  })

  it("turns an unreachable API into a 503 ApiError", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))
    const error = await api("/phone", { method: "PATCH", body: {} }).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 503 })
  })
})

const jwt = (payload: object) =>
  `h.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.s`

describe("toApiError", () => {
  it("reads code, field errors and the request id (as the support code)", async () => {
    const error = await toApiError(
      Response.json(
        {
          code: "VALIDATION_FAILED",
          message: "Request validation failed",
          fieldErrors: [
            { field: "email", code: "ALREADY_EXISTS", message: "" },
          ],
        },
        { status: 422, headers: { "X-Request-Id": "req-42" } }
      )
    )
    expect(error).toMatchObject({
      status: 422,
      code: "VALIDATION_FAILED",
      fieldErrors: [{ field: "email", code: "ALREADY_EXISTS" }],
      digest: "req-42",
    })
  })

  it("survives a body that isn't the API's JSON", async () => {
    const error = await toApiError(
      new Response("<html>Bad gateway</html>", { status: 502 })
    )
    expect(error).toMatchObject({
      status: 502,
      code: "INTERNAL_ERROR",
      fieldErrors: [],
    })
  })
})

describe("secondsLeft", () => {
  const now = 1_000_000_000_000

  it("counts down to the token's exp", () => {
    expect(secondsLeft(jwt({ exp: now / 1000 + 90 }), now)).toBe(90)
  })

  it("treats missing or malformed tokens as expired", () => {
    expect(secondsLeft(undefined, now)).toBe(0)
    expect(secondsLeft("not-a-jwt", now)).toBe(0)
    expect(secondsLeft(jwt({ sub: "u" }), now)).toBe(0)
  })
})
