import { http, HttpResponse } from "msw"

import type {
  AuthTokens,
  Employee,
  ErrorResponse,
  LoginRequest,
  RefreshRequest,
} from "@/api/generated/model"

import { accounts, DEMO_PASSWORD, employees } from "./data"

/**
 * A stateful stand-in for the backend auth (BE-02 behaviour): short-lived access
 * tokens, rotating refresh tokens, and family revocation when an old refresh token
 * is replayed. Set MOCK_ACCESS_TTL (seconds) to test silent refresh quickly.
 */
const ACCESS_TTL = Number(process.env.MOCK_ACCESS_TTL ?? 900)

type Session = { email: string; family: string }
const accessTokens = new Map<string, Session & { expiresAt: number }>()
const refreshTokens = new Map<string, Session & { used: boolean }>()
const revokedFamilies = new Set<string>()

const API = "*"

function error(status: number, body: ErrorResponse) {
  return HttpResponse.json(body, { status })
}

function issue(
  email: string,
  family: string = crypto.randomUUID()
): AuthTokens {
  const accessToken = `at_${crypto.randomUUID()}`
  const refreshToken = `rt_${crypto.randomUUID()}`
  accessTokens.set(accessToken, {
    email,
    family,
    expiresAt: Date.now() + ACCESS_TTL * 1000,
  })
  refreshTokens.set(refreshToken, { email, family, used: false })
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL }
}

function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "")
  const session = token ? accessTokens.get(token) : undefined
  if (
    !session ||
    session.expiresAt < Date.now() ||
    revokedFamilies.has(session.family)
  ) {
    return null
  }
  const account = accounts[session.email]
  return account?.active ? account : null
}

const unauthenticated = () =>
  error(401, {
    code: "UNAUTHENTICATED",
    message: "Missing or expired access token",
  })

export const handlers = [
  http.get(`${API}/health`, () => HttpResponse.json({ status: "ok" })),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as Partial<LoginRequest>
    const fieldErrors: NonNullable<ErrorResponse["fieldErrors"]> = []
    if (!body.email) {
      fieldErrors.push({
        field: "email",
        code: "REQUIRED",
        message: "email is required",
      })
    } else if (!body.email.includes("@")) {
      fieldErrors.push({
        field: "email",
        code: "INVALID_FORMAT",
        message: "email is invalid",
      })
    }
    if (!body.password) {
      fieldErrors.push({
        field: "password",
        code: "REQUIRED",
        message: "password is required",
      })
    }
    if (fieldErrors.length) {
      return error(422, {
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        fieldErrors,
      })
    }

    const account = accounts[body.email!.toLowerCase()]
    if (!account || body.password !== DEMO_PASSWORD) {
      return error(401, {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
      })
    }
    if (!account.active) {
      return error(403, {
        code: "ACCOUNT_DEACTIVATED",
        message: "Account deactivated",
      })
    }
    return HttpResponse.json(issue(account.user.email))
  }),

  http.post(`${API}/auth/refresh`, async ({ request }) => {
    const { refreshToken } = (await request.json()) as RefreshRequest
    const session = refreshTokens.get(refreshToken)
    if (!session || revokedFamilies.has(session.family)) {
      return error(401, {
        code: "SESSION_EXPIRED",
        message: "Refresh token invalid",
      })
    }
    if (session.used) {
      // Replay of a rotated token: assume theft and end every session in the family.
      revokedFamilies.add(session.family)
      return error(401, {
        code: "SESSION_EXPIRED",
        message: "Refresh token reused",
      })
    }
    session.used = true
    return HttpResponse.json(issue(session.email, session.family))
  }),

  http.post(`${API}/auth/logout`, async ({ request }) => {
    const { refreshToken } = (await request.json()) as RefreshRequest
    const session = refreshTokens.get(refreshToken)
    if (session) revokedFamilies.add(session.family)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/me`, ({ request }) => {
    const account = authenticate(request)
    return account ? HttpResponse.json(account.user) : unauthenticated()
  }),

  http.get(`${API}/employees`, ({ request }) => {
    const account = authenticate(request)
    if (!account) return unauthenticated()
    if (account.user.role === "EMPLOYEE") {
      return error(403, {
        code: "FORBIDDEN",
        message: "Admins and managers only",
      })
    }

    const params = new URL(request.url).searchParams
    const page = Math.max(Number(params.get("page") ?? 1), 1)
    const pageSize = Math.min(
      Math.max(Number(params.get("pageSize") ?? 20), 1),
      100
    )
    const search = params.get("search")?.toLowerCase() ?? ""
    const sort = params.get("sort") ?? "name"
    const key = sort.replace(/^-/, "") as keyof Employee
    const direction = sort.startsWith("-") ? -1 : 1

    const matches = employees
      .filter(
        (item) =>
          !search || `${item.name} ${item.email}`.toLowerCase().includes(search)
      )
      .sort((a, b) => String(a[key]).localeCompare(String(b[key])) * direction)

    return HttpResponse.json({
      items: matches.slice((page - 1) * pageSize, page * pageSize),
      meta: {
        page,
        pageSize,
        totalItems: matches.length,
        totalPages: Math.max(Math.ceil(matches.length / pageSize), 1),
      },
    })
  }),
]
