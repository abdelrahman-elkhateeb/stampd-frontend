# Stampd API — Frontend Reference

Everything the frontend needs to build every screen against `stampd-backend`, without reading backend code. Generated from the source on 2026-10-11 (commit `a426f22`). If the code and this file ever disagree, the code wins — but they shouldn't.

---

## Table of contents

1. [Basics](#1-basics) — base URL, headers, CORS, IDs, dates, pagination, errors
2. [Roles, scopes and permissions](#2-roles-scopes-and-permissions)
3. [Auth & session flow](#3-auth--session-flow) — `/auth/*`, `/me`
4. [Company settings, holidays, work calendar, files](#4-company-settings-holidays-work-calendar-files)
5. [Departments](#5-departments)
6. [Employees](#6-employees) — list, create, import, profile, invite, offboarding, photos
7. [Attendance](#7-attendance)
8. [Leave types & balances](#8-leave-types--balances)
9. [Requests & approvals engine](#9-requests--approvals-engine) — all request types
10. [Leave requests (preview + history)](#10-leave-requests)
11. [Calendar & availability](#11-calendar--availability)
12. [Dashboards](#12-dashboards)
13. [Reports & CSV export](#13-reports--csv-export)
14. [History (audit trail)](#14-history-audit-trail)
15. [Health](#15-health)
16. [Enum & code cheat sheet](#16-enum--code-cheat-sheet)
17. [TypeScript types (copy-paste)](#17-typescript-types)
18. [Screen → endpoint map](#18-screen--endpoint-map)
19. [Gotchas](#19-gotchas)

---

## 1. Basics

### Base URL

| Env | URL |
|---|---|
| Local | `http://localhost:4000` (`pnpm dev`) |
| Deployed | `https://<project>.vercel.app` |

All paths below are relative to the base URL. There is **no `/api` prefix and no versioning**.

### CORS — important

The API sends **no CORS headers**. A browser on another origin can't call it directly. Call it from your server side (Next.js route handlers / server actions / BFF) and forward the response, or serve both under one origin via a proxy/rewrite. This is how the frontend is meant to work (`API_BASE_URL` on the Next server).

Exception: `GET /files/{id}?expires&signature` is a plain image response and works in `<img src>` from any origin — but the URL is **relative** (`/files/…`), so prefix it with the API base URL (or proxy `/files/*`).

### Headers

| Header | When | Notes |
|---|---|---|
| `Authorization: Bearer <accessToken>` | every endpoint marked **auth** | |
| `Content-Type: application/json` | JSON bodies | Max body 1 MB |
| `Content-Type: image/png` / `image/jpeg` / `image/webp` | photo/logo upload | raw bytes, **not** multipart, **not** `application/json` |
| `Content-Type: text/csv` (or `text/plain`) | employee CSV import | raw CSV text |
| `X-Request-Id` (optional) | any | Letters, digits, `- _ . :`, ≤128 chars. Echoed back on every response (generated UUID if you don't send one). Log it / send to Sentry for support. |

### IDs

Every id is a **UUID v4 string** (`"3f1c…"`). JSON never contains `_id` or `__v`; it's always `id`. Path params that take an id return `422` if not a UUID.

### Dates & times — three kinds, never mixed

| Kind | Format | Example | Used for |
|---|---|---|---|
| **PlainDate** | `YYYY-MM-DD` | `"2026-10-07"` | leave days, holidays, attendance dates, joining date, last working day. A calendar day in the **company's** calendar. Never convert with a timezone. |
| **Instant** | ISO 8601 UTC with `Z` | `"2026-10-07T05:02:00.000Z"` | check-in/out, decided at, created at. Display in the **company timezone** (`/me` → `company.timezone`), not the browser's. |
| **LocalTime** | `HH:mm` (24h) | `"09:00"` | work start/end, permission times, correction request times. Company local time. |

Month params use `YYYY-MM`. Invalid real dates (`2026-02-30`) are rejected.

### Pagination (every list that returns `{ items, meta }`)

Query: `page` (≥1, default 1), `pageSize` (1–100, default 20), `sort` (a field name; prefix `-` for descending, e.g. `sort=-createdAt`). Unknown sort field → `422` on `sort`.

```json
{
  "items": [ ... ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 57, "totalPages": 3 }
}
```

`totalPages` is at least 1.

**Multi-value query params**: repeat the key — `?status=PENDING&status=APPROVED`. A single value also works.

**Boolean query flags**: exactly `"true"` or `"false"` (anything else → 422).

### Error format (every error)

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "fieldErrors": [
    { "field": "email", "code": "ALREADY_EXISTS", "message": "email is already registered" }
  ]
}
```

- `code` — stable, machine-readable → **translate this** in the UI.
- `message` — English, for logs only. Don't show it raw (except maybe as a fallback).
- `fieldErrors` — only on `422`. `field` is a dotted path matching the body/query key (`data.leaveTypeId`, `startDate`, `body`, `file`, `row`...). One error per field.

| Status | `code` | Meaning |
|---|---|---|
| 401 | `UNAUTHENTICATED` | missing/expired/invalid access token, or session revoked → try refresh, else go to login |
| 401 | `INVALID_CREDENTIALS` | wrong email/password (also for invited accounts with no password) |
| 401 | `SESSION_EXPIRED` | refresh token invalid/expired/reused → go to login |
| 403 | `ACCOUNT_DEACTIVATED` | user deactivated → sign out, show message |
| 403 | `FORBIDDEN` | role can't do this at all |
| 403 | `SELF_APPROVAL` | tried to approve/decide own request |
| 404 | `NOT_FOUND` | doesn't exist **or** outside your scope (same answer on purpose) |
| 404 | `TOKEN_INVALID` | invite/reset link unknown or already used |
| 410 | `TOKEN_EXPIRED` | invite/reset link expired |
| 409 | `CONFLICT` | generic conflict (e.g. "Already deactivated", "Only invited users can receive an invitation") |
| 409 | specific codes | see each endpoint and [§16](#16-enum--code-cheat-sheet) |
| 422 | `VALIDATION_FAILED` | see `fieldErrors` |
| 429 | `TOO_MANY_ATTEMPTS` | rate-limited; read `Retry-After` header (seconds) |
| 500 | `INTERNAL_ERROR` | bug/DB down; show generic error + request id |

Malformed JSON → `422` with `{ field: "body", code: "INVALID_FORMAT" }`. Body over 1 MB → `{ field: "body", code: "OUT_OF_RANGE" }`.

**Field error codes**: `REQUIRED`, `INVALID_FORMAT`, `TOO_SHORT`, `TOO_LONG`, `OUT_OF_RANGE`, `ALREADY_EXISTS`, `TOO_COMMON`, `CONTAINS_PERSONAL_INFO`, `INCORRECT`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `UNKNOWN_REFERENCE`, `SELF_MANAGER`, `NOT_A_MANAGER`, `MANAGER_LOOP`, `NO_WORKING_DAYS`, `CROSSES_LEAVE_YEAR`.

Unknown route → `404 { code: "NOT_FOUND", message: "No route for GET /x" }`.

---

## 2. Roles, scopes and permissions

Roles: `EMPLOYEE`, `MANAGER`, `ADMIN` (Admin = HR). One per user.

Scopes:
- **self** — your own records.
- **team** — your **active direct reports** (employees whose manager is you, not deactivated). No skip-level. Re-read on every request, so reassignment applies immediately.
- **company** — everyone in your company.

| Resource | Action | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|---|
| Employee profile | view | self | self + team | company |
| | create/edit/delete | — | — | company (non-admins may edit **only their own `phone`**) |
| Employee list (`GET /employees`) | view | **403** | team (not self!) | company |
| Employee photo | edit | self | self | company |
| Attendance | view | self | self + team | company |
| | check-in/out | self | self | self |
| | corrections | — | — | company |
| Attendance exceptions | view | — | — | company |
| Leave balances & requests, all requests | view | self | self + team | company |
| | create / cancel own | self | self | self |
| | approve | — | team | company |
| Leave types | view | all | all | all |
| | edit | — | — | ✓ |
| Leave balance adjust / entitlement | edit | — | — | ✓ |
| Company settings, holidays, departments | view | all | all | all |
| | edit | — | — | ✓ |
| Team dashboard | view | — | ✓ | ✓ |
| Admin dashboard | view | — | — | ✓ |
| Reports | view | self | self + team | company |
| Users (invite, role, deactivate) | all | — | — | ✓ |

How the server answers:
- Role has no grant → `403 FORBIDDEN` (nothing changes).
- Has a grant but target employee is outside scope → `404 NOT_FOUND` (same as nonexistent).
- Deciding your own request → `403 SELF_APPROVAL` (exception: company's **only** Admin with no manager — allowed, flagged `selfApproved`).

**Colleague privacy** (calendar, "who's off" in leave preview): an Employee sees same-department colleagues only as **name + OUT** (leave) or **name + WFH**; never type/reason/dates detail, never trips/permissions/pending. Managers see full detail for self + direct reports, nothing about others. Admin sees everything.

Use `/me.role` to hide UI, but always handle 403/404 — the server is the authority. Request objects also carry an `actions` array telling you exactly which buttons to show.

---

## 3. Auth & session flow

### Tokens

All token-issuing endpoints return:

```json
{ "accessToken": "eyJ...", "refreshToken": "base64url...", "expiresIn": 900 }
```

- **Access token**: JWT, 15 min (`expiresIn` seconds). Send as `Authorization: Bearer`.
- **Refresh token**: opaque, 30 days, **rotated on every refresh** (the old one stops working; store the new one).
- **Grace window**: for 20 s after a rotation, presenting the *previous* refresh token returns the **same** new pair (safe for parallel refreshes). Presenting it after 20 s = reuse → **whole session revoked** → `401 SESSION_EXPIRED`. So: dedupe concurrent refreshes, and always persist the newest refresh token.
- Every request re-checks session + user status/role in the DB: logout, deactivation, role change take effect on the next request.

Recommended client logic:
1. On `401 UNAUTHENTICATED` → call `/auth/refresh` once (single-flight), retry the original request.
2. Refresh returns `401 SESSION_EXPIRED` or `403 ACCOUNT_DEACTIVATED` → clear tokens, go to login (show deactivated message for the latter).
3. Store tokens in httpOnly cookies on your Next server (the API itself sets no cookies).

### `POST /auth/signup` — no auth

Creates a company + its first Admin (who is also an employee). Seeds 4 leave types (Annual 21, Sick 30, Emergency 3, Unpaid untracked). Working days default Sun–Thu, 09:00–17:00.

Body:
| Field | Type | Rules |
|---|---|---|
| `companyName` | string | 1–120, trimmed |
| `name` | string | 1–120, trimmed |
| `email` | string | valid email, ≤254 |
| `password` | string | see password rules below |
| `timezone` | string | IANA, e.g. `"Asia/Riyadh"` |
| `acceptTerms` | boolean | must be `true` (else `REQUIRED`) |
| `termsVersion` | string | 1–40 |
| `locale` | `"en"` \| `"ar"` | optional, default `"en"` |

→ `201` tokens. Errors: `422` (`email: ALREADY_EXISTS`, password codes, timezone `INVALID_FORMAT`).

**Password rules** (signup, accept invite, reset, change): 10–128 chars (`TOO_SHORT`/`TOO_LONG`), not a common password (`TOO_COMMON`), must not contain any 3+ char word of the person's name or of the email's local part (before `@`) (`CONTAINS_PERSONAL_INFO`). The email domain never counts. Mirror this in the form for instant feedback.

### `POST /auth/login` — no auth

Body: `{ "email": string, "password": string }` → `200` tokens.

Errors:
- `401 INVALID_CREDENTIALS` — wrong email/password, or account still INVITED.
- `403 ACCOUNT_DEACTIVATED` — only after a correct password.
- `429 TOO_MANY_ATTEMPTS` + `Retry-After` — 10 failures for the same email from the same IP in 15 min. Show a countdown.

### `POST /auth/refresh` — no auth

Body: `{ "refreshToken": string }` → `200` new tokens. Errors: `401 SESSION_EXPIRED`, `403 ACCOUNT_DEACTIVATED`.

### `POST /auth/logout` — no auth

Body: `{ "refreshToken": string }` → `204`. Unknown tokens are silently ignored (always 204).

### Invitations (accept-invite page `/{locale}/invite/{token}`)

Invite link format: `{WEB_APP_URL}/{locale}/invite/{token}` — `locale` is the invited user's locale. Valid 7 days, single use. A new invite invalidates older ones. (Emails aren't sent yet — links are logged by the API outside production.)

**`POST /auth/invitations/verify`** — body `{ "token": string }` → `200`:
```json
{ "companyName": "Acme", "name": "Sara Ali", "email": "sara@acme.com", "expiresAt": "2026-10-18T10:00:00.000Z" }
```
Errors: `404 TOKEN_INVALID`, `410 TOKEN_EXPIRED`.

**`POST /auth/invitations/accept`** — body `{ "token", "name" (1–120), "password" }` → `200` tokens (user becomes ACTIVE, name updated). Errors: `404 TOKEN_INVALID`, `410 TOKEN_EXPIRED`, `403 ACCOUNT_DEACTIVATED`, `422` password.

### Password reset (page `/{locale}/reset-password/{token}`)

Link valid 1 hour, single use.

**`POST /auth/password/forgot`** — body `{ "email" }` → always `202` (no account enumeration; silently rate-limited to 5/hour per email; only ACTIVE accounts get a link).

**`POST /auth/password/reset/verify`** — body `{ "token" }` → `204` if usable. Errors: `404 TOKEN_INVALID`, `410 TOKEN_EXPIRED`. Use on page load.

**`POST /auth/password/reset`** — body `{ "token", "password" }` → `200` tokens (new session; **all other sessions revoked**, login lockouts cleared). Errors: token errors, `403 ACCOUNT_DEACTIVATED`, `422` password.

### `GET /me` — auth

```json
{
  "id": "uuid",
  "name": "Sara Ali",
  "email": "sara@acme.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "locale": "en",
  "employee": { "id": "uuid", "name": "Sara Ali" },
  "company": {
    "id": "uuid",
    "name": "Acme",
    "timezone": "Asia/Riyadh",
    "weekStart": "SUN",
    "workingDays": ["SUN", "MON", "TUE", "WED", "THU"]
  }
}
```

`id === employee.id` (user and employee share one id). For photo/department/manager/job title, call `GET /employees/{me.id}`. For work hours etc., `GET /company/settings`.

### `POST /me/password` — auth

Body: `{ "currentPassword": string, "newPassword": string }` → `204`. Other sessions are revoked; the current one stays.
Errors: `422 currentPassword: INCORRECT`, `422 newPassword: <password code>`, `429 TOO_MANY_ATTEMPTS` (wrong current password counts toward the login limit).

---

## 4. Company settings, holidays, work calendar, files

### `GET /company/settings` — auth, every role

```json
{
  "name": "Acme",
  "timezone": "Asia/Dubai",
  "timezoneEffectiveFrom": "2026-10-12",
  "weekStart": "SUN",
  "workingDays": ["SUN", "MON", "TUE", "WED", "THU"],
  "workStartTime": "09:00",
  "workEndTime": "17:00",
  "lateGraceMinutes": 0,
  "leaveYearStartMonth": 1,
  "disabledRequestTypes": [],
  "logoUrl": "/files/uuid?expires=1760227200&signature=..." 
}
```

- `timezone` is the **newest** value. If a change is pending (applies from tomorrow), `timezoneEffectiveFrom` is that date; otherwise `null`. Show "Timezone changes to X from {date}".
- `logoUrl` is `null` when no logo; relative signed URL otherwise.
- `leaveYearStartMonth`: 1 = January.

### `PATCH /company/settings` — Admin

Any subset of:
| Field | Type | Rules |
|---|---|---|
| `name` | string | 1–120 |
| `timezone` | string | IANA. Applies from the company's **next day**. |
| `weekStart` | Weekday | `SUN`…`SAT` |
| `workingDays` | Weekday[] | ≥1, no duplicates |
| `workStartTime` | `HH:mm` | |
| `workEndTime` | `HH:mm` | must be after start (`422 workEndTime OUT_OF_RANGE`) |
| `lateGraceMinutes` | int | 0–240 |
| `leaveYearStartMonth` | int | 1–12 |
| `disabledRequestTypes` | string[] | request type keys to turn **off**, e.g. `["BUSINESS_TRIP"]`. `[]` = all on. Max 20, `^[A-Z_]{1,50}$`. Replaces the whole list. |

→ `200` settings (same shape as GET).

### Logo — Admin

- **`PUT /company/logo`** — raw image body (`Content-Type: image/png|jpeg|webp`), ≤ 2 MB → `200 { "logoUrl": "/files/..." }`.
- **`DELETE /company/logo`** → `204`.

Upload errors (422, field `file`): `REQUIRED` (empty body), `FILE_TOO_LARGE` (>2 MB), `UNSUPPORTED_FILE_TYPE` (type detected from bytes: PNG/JPEG/WebP only; no SVG/GIF).

```ts
await fetch(`${API}/company/logo`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type },
  body: file, // a File/Blob — NOT FormData
})
```

### `GET /files/{id}?expires=…&signature=…` — no auth

Returns the image bytes with its content type. Valid ≥ 24 h; URLs change at most hourly (cacheable). Invalid/expired → `404`. Re-fetch the owning resource to get a fresh URL.

### Holidays

A holiday is one record spanning `startDate`–`endDate` (inclusive; one-day holiday has start = end; max 31 days).

**`GET /company/holidays?year=2026`** — auth, every role. `year` optional (2000–2100; default = company's current year). Returns holidays with **any** day in that year, sorted by start:
```json
{ "year": 2026, "items": [ { "id": "uuid", "name": "National Day", "startDate": "2026-12-02", "endDate": "2026-12-03" } ] }
```

**`POST /company/holidays`** — Admin. Body `{ "name" (1–100), "startDate", "endDate" }` → `201`:
```json
{
  "holiday": { "id": "uuid", "name": "...", "startDate": "...", "endDate": "..." },
  "affectedRequests": [
    { "requestId": "uuid", "employeeId": "uuid", "employeeName": "Lina", "type": "LEAVE", "startDate": "2026-12-01", "endDate": "2026-12-05" }
  ]
}
```
`affectedRequests` = approved requests (leave, WFH, trips…) overlapping the holiday. They are **not** changed automatically — show them so the Admin can decide (e.g. cancel and ask to resubmit).

**`PATCH /company/holidays/{id}`** — Admin. Any subset of the body → `200` same shape.
**`DELETE /company/holidays/{id}`** — Admin → `204`.
Errors: `422 endDate OUT_OF_RANGE` (end < start, or > 31 days), `404`.

### `GET /company/calendar?from&to&halfDayStart&halfDayEnd` — auth, every role

Working-day calendar. `from`, `to` required (PlainDate, `to ≥ from`, ≤ 366 days). `halfDayStart`/`halfDayEnd` (`true|false`) subtract 0.5 from the count if that end is a working day.

```json
{
  "from": "2026-10-01", "to": "2026-10-07",
  "workingDayCount": 4.5,
  "days": [
    { "date": "2026-10-01", "weekday": "THU", "working": true, "holiday": null },
    { "date": "2026-10-02", "weekday": "FRI", "working": false, "holiday": null },
    { "date": "2026-10-05", "weekday": "MON", "working": false, "holiday": { "id": "uuid", "name": "Some Holiday" } }
  ]
}
```

Use this for date pickers (grey out non-working days).

---

## 5. Departments

Flat list, unique name per company (case-insensitive).

**`GET /departments`** — auth, every role:
```json
{ "items": [ { "id": "uuid", "name": "Operations", "employeeCount": 12 } ] }
```
Sorted by name. `employeeCount` counts employees of any status.

**`POST /departments`** — Admin. `{ "name": string (1–80) }` → `201 { id, name, employeeCount: 0 }`.
**`PATCH /departments/{id}`** — Admin. `{ "name" }` → `200 { id, name, employeeCount }`.
**`DELETE /departments/{id}`** — Admin → `204`.

Errors: `422 name ALREADY_EXISTS`; `409 DEPARTMENT_NOT_EMPTY` (move employees first — includes deactivated ones); `404`.

---

## 6. Employees

A person = one user account + one employee record, **same id**.

### Employee profile object (`EmployeeProfile`)

Returned by every employee endpoint:
```json
{
  "id": "uuid",
  "name": "Lina Haddad",
  "email": "lina@acme.com",
  "phone": "+971500000000",
  "jobTitle": "Accountant",
  "employeeCode": "E-104",
  "department": { "id": "uuid", "name": "Finance" },
  "manager": { "id": "uuid", "name": "Omar" },
  "role": "EMPLOYEE",
  "status": "ACTIVE",
  "joiningDate": "2025-03-01",
  "employmentType": "FULL_TIME",
  "tracksAttendance": true,
  "lastWorkingDay": null,
  "photoUrl": "/files/uuid?expires=...&signature=..."
}
```
- `status`: `INVITED` (no password yet) | `ACTIVE` | `DEACTIVATED`.
- `lastWorkingDay`: set when offboarding scheduled/done. `status: ACTIVE` + `lastWorkingDay` = "Leaving on {date}".
- `department`, `manager`, `phone`, `jobTitle`, `employeeCode`, `joiningDate`, `photoUrl` may be `null`.
- `employmentType`: `FULL_TIME` | `PART_TIME` | `CONTRACTOR` (informational).
- `tracksAttendance: false` → person never checks in; no attendance expected.

### `GET /employees` — Manager (team only) or Admin; Employee → 403

Query (plus pagination; `sort` ∈ `name` (default), `joiningDate`, `createdAt`):
| Param | Notes |
|---|---|
| `search` | 1–100 chars; matches name, email or employee code (case-insensitive, substring) |
| `departmentId` | uuid |
| `managerId` | uuid |
| `status` | multi: `INVITED`, `ACTIVE`, `DEACTIVATED` |
| `role` | multi: `EMPLOYEE`, `MANAGER`, `ADMIN` |

→ `200 { items: EmployeeProfile[], meta }`. A Manager only gets their active direct reports (not themselves).

### `POST /employees` — Admin

Creates an INVITED account + employee and issues an invitation (7 days).

| Field | Type | Required | Default |
|---|---|---|---|
| `name` | string 1–120 | ✓ | |
| `email` | email ≤254 | ✓ | |
| `joiningDate` | PlainDate | ✓ | |
| `phone` | string ≤30 \| null | | null (`""` → null) |
| `jobTitle` | string ≤100 \| null | | null |
| `employeeCode` | string ≤30 \| null | | null (unique per company) |
| `employmentType` | enum | | `FULL_TIME` |
| `tracksAttendance` | boolean | | `true` |
| `role` | enum | | `EMPLOYEE` |
| `departmentId` | uuid \| null | | |
| `managerId` | uuid \| null | | |
| `locale` | `en`\|`ar` | | `en` (language of the invite link) |

→ `201`:
```json
{ "employee": { ...EmployeeProfile }, "invitation": { "expiresAt": "2026-10-18T10:00:00.000Z" } }
```

Errors (422): `email ALREADY_EXISTS` (emails are unique platform-wide), `employeeCode ALREADY_EXISTS`, `departmentId UNKNOWN_REFERENCE`, `managerId UNKNOWN_REFERENCE | SELF_MANAGER | NOT_A_MANAGER | MANAGER_LOOP`.

**Manager rules**: the manager must be another employee of the company, with role MANAGER or ADMIN, not deactivated, and no reporting loop (A→B→A, direct or indirect).

### `POST /employees/import` — Admin (CSV)

Body: raw CSV text, `Content-Type: text/csv` (or `text/plain`), ≤ 1 MB, ≤ 1000 data rows.

Header row required; columns in any order, case-insensitive:
- required: `name`, `email`, `joiningDate` (YYYY-MM-DD)
- optional: `role` (EMPLOYEE/MANAGER/ADMIN, any case; default EMPLOYEE), `department` (existing department **name**), `managerEmail` (existing employee's email, or an email of a row **above** in the same file), `jobTitle`, `phone`, `employeeCode`, `employmentType` (`full time`/`full-time`/`FULL_TIME` all work; default FULL_TIME), `tracksAttendance` (`true/yes/1/y` or `false/no/0/n`; default true)

Blank cells use defaults. Each valid row is created + invited in its own transaction (partial success).

→ `200`:
```json
{
  "createdCount": 50,
  "created": [ { "row": 2, "id": "uuid", "email": "a@acme.com" } ],
  "errors": [ { "row": 7, "field": "email", "code": "ALREADY_EXISTS", "message": "..." } ]
}
```
`row` = line number in the file (header is line 1). `field` = CSV column name (`managerEmail`, `department`, …).

Whole-file errors (422, field `file`): `REQUIRED` (no body / no rows / wrong content type), `INVALID_FORMAT` (bad CSV, unknown column, missing required column), `TOO_LONG` (>1000 rows).

### `GET /employees/{id}` — auth

Self, Manager's team, or Admin → `200 EmployeeProfile`. Otherwise `404`.

### `PATCH /employees/{id}` — auth

Any subset of: `name`, `email`, `phone`, `jobTitle`, `employeeCode`, `joiningDate` (PlainDate | null), `employmentType`, `tracksAttendance`, `role`, `departmentId` (uuid|null), `managerId` (uuid|null). Empty body = no-op.

- **Admin**: anything, anyone.
- **Everyone else**: only `{ "phone" }` on **their own** record. Any other field or someone else's record → `403 FORBIDDEN`. Record not visible → `404`.

→ `200 EmployeeProfile`.

Errors: same 422s as create; `409 HAS_DIRECT_REPORTS` (demoting a Manager with active reports to EMPLOYEE); `409 LAST_ADMIN` (removing the last Admin role).

### `POST /employees/{id}/invitation` — Admin

Resend the invite (invalidates the old link) → `200 { "expiresAt": "..." }`. `409 CONFLICT` if the user isn't INVITED.

### Photos

- **`PUT /employees/{id}/photo`** — own photo (any role) or Admin for anyone. Raw image body (same rules as logo) → `200 { "photoUrl": "/files/..." }`.
- **`DELETE /employees/{id}/photo`** → `204`.

### Offboarding — Admin

Two steps.

**`POST /employees/{id}/deactivation/preview`** — body `{ "lastWorkingDay": PlainDate }` → `200` (changes nothing):
```json
{
  "lastWorkingDay": "2026-10-31",
  "directReports": [ { "id": "uuid", "name": "Lina" } ],
  "pendingRequests": [ { "id": "uuid", "type": "LEAVE", "startDate": "...", "endDate": "..." } ],
  "futureApprovedTimeOff": [ { "id": "uuid", "type": "WFH", "startDate": "...", "endDate": "..." } ]
}
```

**`POST /employees/{id}/deactivation`** — body:
```json
{ "lastWorkingDay": "2026-10-31", "reassignReportsTo": "uuid-or-null" }
```
`reassignReportsTo` is required when `directReports` is non-empty (`409 HAS_DIRECT_REPORTS` otherwise); must be a valid manager (422 on `reassignReportsTo`, e.g. `NOT_A_MANAGER`).
Effects: reports moved, pending requests **withdrawn**, approved requests ending after the last day **cancelled** (balances restored), `lastWorkingDay` set. Sign-in works through that day; afterwards the account becomes DEACTIVATED automatically. A past `lastWorkingDay` deactivates immediately (sessions revoked). → `200 EmployeeProfile`.

Errors (both steps): `403 FORBIDDEN` (deactivating yourself), `409 CONFLICT` ("Already deactivated"), `404`.

**`POST /employees/{id}/reactivation`** — no body → `200 EmployeeProfile`. Status becomes ACTIVE (or INVITED if they never set a password); `lastWorkingDay` cleared. Also cancels a *scheduled* deactivation. `409 CONFLICT` if not deactivated/scheduled.

---

## 7. Attendance

Sessions (check-in → check-out) roll up into one **day** per employee per company-calendar date. Multiple sessions per day are allowed (breaks); never two open at once.

### Day object (`DayView`)

```json
{
  "recordId": "uuid-or-null",
  "date": "2026-10-11",
  "status": "LATE",
  "flags": ["CORRECTED"],
  "firstCheckInAt": "2026-10-11T05:12:00.000Z",
  "lastCheckOutAt": "2026-10-11T13:30:00.000Z",
  "workedMinutes": 498
}
```
- `recordId`: id for `GET /history/attendance-days/{recordId}`; `null` when nothing is stored (computed day).
- `status` (nullable — `null` = nothing to show yet / not expected):

| Status | Meaning |
|---|---|
| `PRESENT` | checked in on time |
| `LATE` | first check-in after work start + grace (unless excused by permission/half-day leave) |
| `ABSENT` | working day over, expected, no check-in (also approved WFH with no check-in → flag `WFH_NO_CHECK_IN`) |
| `WFH` | approved WFH day (they still check in) |
| `ON_LEAVE` | approved full-day leave |
| `BUSINESS_TRIP` | approved trip (never Absent) |
| `HOLIDAY` | company holiday |
| `WEEKEND` | non-working weekday |
| `MISSING_CHECKOUT` | day ended with a session still open (that session's time doesn't count) |

- `flags`: `WORKED_ON_NON_WORKING_DAY`, `WORKED_DURING_TIME_OFF`, `CORRECTED`, `WFH_NO_CHECK_IN`.
- `workedMinutes`: closed sessions only (open session not counted).
- Precedence: weekend/holiday → approved full-day leave/WFH/trip → checked-in rules → absent.
- Before the day is over, no check-in = `status: null` (never Absent during the day).

### Session object (`SessionView`)

```json
{ "id": "uuid", "checkInAt": "...", "checkOutAt": "...|null", "autoClosedAt": "...|null", "source": "SELF" }
```
`source`: `SELF` (clocked) | `CORRECTION` (added by Admin). `autoClosedAt` set when the day closed with it open. Admins additionally get `checkInIp`, `checkInUserAgent`, `checkOutIp`, `checkOutUserAgent` in day detail.

### `POST /attendance/check-in` — auth (self)

No body. Server time is used. → `201` if a session was opened, `200` if one was already open (double-click / two tabs safe). Body = **Today object**.
Error: `409 ATTENDANCE_NOT_TRACKED` (employee has `tracksAttendance: false`).

### `POST /attendance/check-out` — auth (self)

No body → `200` Today object. Error: `409 NO_OPEN_SESSION`.

### `GET /attendance/today` — auth (self)

Today object = `DayView` +:
```json
{
  "...DayView fields": "",
  "expected": true,
  "tracksAttendance": true,
  "openSession": { "id": "uuid", "checkInAt": "..." },
  "sessions": [ SessionView ]
}
```
- Show **Check out** if `openSession`, else **Check in** (hide both if `!tracksAttendance`).
- Live timer: `workedMinutes` + (now − `openSession.checkInAt`).
- `expected: false` → day where attendance isn't expected (not joined yet, past last day, untracked).

### `GET /attendance/days?date=YYYY-MM-DD` / `GET /attendance/month?month=YYYY-MM` — auth

Grid of employees × days, scoped by role (self / self+team / company).
Query: `date` or `month` (required), `departmentId`, `employeeId` (optional filters), pagination (`sort=name` only; pages are over **employees**).

```json
{
  "from": "2026-10-01", "to": "2026-10-31",
  "items": [
    { "employee": { "id": "uuid", "name": "Lina" }, "days": [ DayView, DayView, ... ] }
  ],
  "meta": { ... }
}
```
Every date in the range is present for every employee. Includes everyone in scope (also invited/untracked people — their days will usually be `status: null`).

### `GET /attendance/employees/{employeeId}/days/{date}` — auth

Self / team / Admin.
```json
{ "employee": { "id": "uuid", "name": "Lina" }, "day": DayView, "sessions": [ SessionView ] }
```

### `GET /attendance/exceptions?from&to&type` — Admin

Stored `MISSING_CHECKOUT` and `ABSENT` days. `from`, `to` required (≤ 92 days), `type` multi (`MISSING_CHECKOUT`, `ABSENT`; default both), pagination (`sort=date`, default `-date`).
```json
{ "items": [ { "employee": { "id": "uuid", "name": "Lina" }, ...DayView } ], "meta": {...} }
```

### Corrections — Admin (reason required)

All return the corrected **day detail** (with device fields). The day gets flag `CORRECTED`; history keeps before/after.

- **Add a session**: `POST /attendance/employees/{employeeId}/days/{date}/sessions`
  `{ "checkInAt": Instant, "checkOutAt": Instant, "reason": "string ≤500" }` → `201`
- **Edit a session**: `PATCH /attendance/sessions/{sessionId}`
  `{ "checkInAt"?: Instant, "checkOutAt"?: Instant, "reason": "..." }` → `200` (also closes an open/missing-checkout session when you give `checkOutAt`)
- **Delete a session**: `DELETE /attendance/sessions/{sessionId}` with JSON body `{ "reason": "..." }` → `200`

Instants accept any offset (`2026-10-11T09:00:00+04:00` is fine). Build them from the **company timezone**, not the browser's.

Errors (422):
- `reason REQUIRED`, `reason TOO_LONG`
- `date OUT_OF_RANGE` (future day)
- `checkInAt OUT_OF_RANGE` (not on that date in company time / overlaps another session)
- `checkOutAt REQUIRED` | `OUT_OF_RANGE` (other day — no session crosses midnight / not after check-in / in the future)
- `404` unknown session

Non-Admins request corrections via the `ATTENDANCE_CORRECTION` request type ([§9](#9-requests--approvals-engine)).

---

## 8. Leave types & balances

### Leave type object (`LeaveType`)

```json
{
  "id": "uuid",
  "name": "Annual",
  "icon": "annual",
  "paid": true,
  "tracksBalance": true,
  "defaultAllowanceDays": 21,
  "allowNegativeBalance": false,
  "halfDaysAllowed": true,
  "requiresReason": false,
  "archived": false,
  "inUse": true
}
```
`icon` ∈ `annual, sick, emergency, unpaid, maternity, paternity, bereavement, marriage, hajj, study, other`. `tracksBalance: false` → no balance, never limited (e.g. Unpaid). `inUse` → can't delete or toggle `tracksBalance`; archive instead.

Defaults for new companies: Annual (21, reason optional), Sick (30, reason required), Emergency (3, reason required), Unpaid (untracked, unpaid, reason required). All half-day-capable.

**`GET /leave/types?includeArchived=true|false`** — auth, every role → `{ "items": LeaveType[] }`. `includeArchived` only honoured for Admins.

**`POST /leave/types`** — Admin. Body (defaults shown):
```json
{ "name": "Hajj", "icon": "other", "paid": true, "tracksBalance": true, "defaultAllowanceDays": 0,
  "allowNegativeBalance": false, "halfDaysAllowed": true, "requiresReason": false }
```
`name` 1–60 unique; `defaultAllowanceDays` 0–366 in 0.5 steps (forced to 0 if untracked) → `201 LeaveType`.

**`PATCH /leave/types/{id}`** — Admin. Any subset + `archived: boolean` → `200 LeaveType`. A new default allowance applies only to entitlements created afterwards.

**`DELETE /leave/types/{id}`** — Admin → `204`.

Errors: `422 name ALREADY_EXISTS`; `409 LEAVE_TYPE_IN_USE` (delete a used type, or change `tracksBalance` on a used type).

### Balance object (`Balance`)

Balances are computed from an append-only ledger.

```json
{
  "balanceId": "uuid-or-null",
  "leaveType": { "id", "name", "icon", "paid", "tracksBalance", "allowNegativeBalance", "halfDaysAllowed", "requiresReason" },
  "year": 2026,
  "period": { "start": "2026-01-01", "end": "2026-12-31" },
  "tracked": true,
  "proposedEntitlement": 21,
  "entitlementSource": "PRORATED",
  "entitlement": 15.5,
  "adjustments": 2,
  "used": 3,
  "upcoming": 1,
  "pending": 2,
  "available": 11.5
}
```
- `available = entitlement + adjustments − used − upcoming − pending`.
- `used` = approved days already passed; `upcoming` = approved days from today on; `pending` = reserved by pending requests.
- `entitlementSource`: `DEFAULT` | `PRORATED` (joined mid-year, rounded to 0.5) | `OVERRIDE` (Admin set it).
- Untracked types: `tracked: false`, `balanceId: null`, all numbers `null`.
- **Leave year** is named by the calendar year it starts in (with `leaveYearStartMonth = 4`, year 2026 = 2026-04-01…2027-03-31). Nothing carries over automatically.

**`GET /leave/employees/{employeeId}/balances?year=`** — self / team / Admin → `{ "year": 2026, "items": Balance[] }` (one per active type). `year` optional (default current leave year).

**`GET /leave/employees/{employeeId}/balances/{leaveTypeId}/entries?year=&page&pageSize`** — ledger (oldest first):
```json
{
  "balance": Balance,
  "items": [
    {
      "id": "uuid", "type": "DEDUCTION", "days": 2,
      "breakdown": [ { "date": "2026-03-01", "days": 1 }, { "date": "2026-03-02", "days": 1 } ],
      "requestId": "uuid", "reason": null,
      "actor": { "type": "USER", "id": "uuid", "name": "Omar" },
      "at": "2026-02-20T08:00:00.000Z"
    }
  ],
  "meta": {...}
}
```
Entry `type`: `ALLOWANCE` (±, entitlement), `ADJUSTMENT` (±, Admin with reason), `RESERVATION` (pending), `RELEASE` (reservation ended), `DEDUCTION` (approved, per date), `RESTORATION` (cancelled approved days). `actor` may be `{ "type": "SYSTEM", "job": "..." }`.

**`POST /leave/employees/{employeeId}/balances/{leaveTypeId}/adjustments`** — Admin
`{ "days": number (non-zero, 0.5 steps, ±), "reason": string (required, ≤500), "year"?: number }` → `201 Balance`. Use for carry-over too.

**`PUT /leave/employees/{employeeId}/balances/{leaveTypeId}/entitlement`** — Admin
`{ "days": number (≥0, 0.5 steps), "reason"?: string, "year"?: number }` → `200 Balance` (source becomes `OVERRIDE`).

Errors: `422 days INVALID_FORMAT`, `422 reason REQUIRED` (adjustment), `409 LEAVE_TYPE_NOT_TRACKED`, `404`.

---

## 9. Requests & approvals engine

One engine for all request types: `LEAVE`, `WFH`, `PERMISSION`, `BUSINESS_TRIP`, `ATTENDANCE_CORRECTION`.

### Lifecycle

```
PENDING ──approve──▶ APPROVED ──requester asks (before start)──▶ CANCELLATION_REQUESTED
   │                    │                                         │         │
   ├─reject (reason)─▶ REJECTED                      approve-cancel│         │decline
   └─withdraw───────▶ WITHDRAWN                                    ▼         ▼
                        │                                      CANCELLED   APPROVED
                        └──Admin cancel (reason, any time)──▶ CANCELLED
```
- No drafts. Requests are **never edited** — withdraw and resubmit.
- `APPROVED` and `CANCELLATION_REQUESTED` both count as "in effect".
- First decision wins: a concurrent second decision gets `409 REQUEST_STATUS_CONFLICT` → refetch.

### Who decides

- The requester's **current manager** or **any Admin** (`MANAGER_WITH_ADMIN_FALLBACK`), or **Admins only** (`ADMIN_ONLY`: attendance corrections).
- Nobody decides their own (`403 SELF_APPROVAL`), except the company's **only** Admin with no manager → allowed, `decision.selfApproved: true`.

### Request types

**`GET /requests/types?includeDisabled=true|false`** — auth → `{ "items": RequestType[] }`
```json
{
  "key": "BUSINESS_TRIP",
  "label": "Business trip",
  "enabled": true,
  "approverPolicy": "MANAGER_WITH_ADMIN_FALLBACK",
  "dates": "RANGE",
  "times": "NONE",
  "reason": "OPTIONAL",
  "colleagueVisibility": "HIDDEN",
  "fields": [
    { "name": "destination", "kind": "text", "required": true, "maxLength": 100 },
    { "name": "purpose", "kind": "text", "required": true, "maxLength": 500 }
  ]
}
```
Types turned off in settings are omitted (Admins can pass `includeDisabled=true` to see them with `enabled: false`). Build request forms generically from this: `dates` (`SINGLE_DAY` → one date picker; `RANGE` → two), `times` (`NONE`/`OPTIONAL`/`REQUIRED` → `startTime`/`endTime` HH:mm), `reason`, and `fields` → `data.<name>` (`kind`: `text` | `time` (HH:mm) | `choice` (one of `options`) | `leaveType` (id from `/leave/types`)).

Registered types:

| Key | Label | Dates | Times | Reason | Approver | `data` | Colleague view | Rules |
|---|---|---|---|---|---|---|---|---|
| `LEAVE` | Leave | RANGE | NONE | per leave type | manager→Admin | `{ leaveTypeId, firstDayHalf?, lastDayHalf? }` | OUT | see §10 |
| `WFH` | Work from home | RANGE | NONE | optional | manager→Admin | `{}` | WFH | ≥1 working day (`422 endDate NO_WORKING_DAYS`); no overlap with own pending/approved LEAVE or WFH (`409 REQUEST_OVERLAP`). Still must check in; no check-in → ABSENT + `WFH_NO_CHECK_IN`. |
| `PERMISSION` | Permission / early leave | SINGLE_DAY | REQUIRED | optional | manager→Admin | `{}` | hidden | working day (`422 startDate NO_WORKING_DAYS`); `startTime ≥ workStartTime`, `endTime ≤ workEndTime` (`422 OUT_OF_RANGE`). Arriving before `endTime` isn't Late. |
| `BUSINESS_TRIP` | Business trip | RANGE | NONE | optional | manager→Admin | `{ destination (1–100), purpose (1–500) }` | hidden | no overlap with own LEAVE (`409 REQUEST_OVERLAP`). Days read BUSINESS_TRIP. |
| `ATTENDANCE_CORRECTION` | Attendance correction | SINGLE_DAY | NONE | **required** | **Admin only** | `{ checkInTime?: "HH:mm", checkOutTime?: "HH:mm" }` (at least one) | hidden | not future, ≤30 days back (`422 startDate OUT_OF_RANGE`); if nothing recorded that day both times required (`422 data.checkInTime/checkOutTime REQUIRED`) and it must be a working day. On approval: no sessions → one session in→out; else check-in moves the first session's start, check-out sets the last session's end. |

### Request object (`Request`)

Returned by lists; detail adds `timeline`.
```json
{
  "id": "uuid",
  "type": "LEAVE",
  "typeLabel": "Leave",
  "requester": { "id": "uuid", "name": "Lina" },
  "startDate": "2026-11-02",
  "endDate": "2026-11-04",
  "startTime": null,
  "endTime": null,
  "reason": "Family trip",
  "data": { "leaveTypeId": "uuid", "firstDayHalf": null, "lastDayHalf": "MORNING" },
  "status": "PENDING",
  "approverPolicy": "MANAGER_WITH_ADMIN_FALLBACK",
  "createdBy": { "id": "uuid", "name": "Lina" },
  "createdAt": "2026-10-11T08:00:00.000Z",
  "submittedAt": "2026-10-11T08:00:00.000Z",
  "decision": {
    "by": { "id": "uuid", "name": "Omar" },
    "at": "2026-10-11T09:00:00.000Z",
    "comment": "Enjoy",
    "selfApproved": false
  },
  "cancellation": {
    "requestedAt": "...|null",
    "reason": "...|null",
    "cancelledBy": { "id": "uuid", "name": "..." },
    "cancelledAt": "...|null"
  },
  "actions": ["APPROVE", "REJECT"]
}
```
- `decision` is `null` until approved/rejected; `comment` = approval comment or rejection reason.
- `cancellation` is `null` unless cancellation was requested or it was cancelled.
- `createdBy` ≠ `requester` when an Admin submitted on their behalf.
- **`actions`** — what the caller may do *now*. Drive the buttons from this:

| Action | Endpoint |
|---|---|
| `APPROVE` | `POST /requests/{id}/approve` |
| `REJECT` | `POST /requests/{id}/reject` |
| `WITHDRAW` | `POST /requests/{id}/withdraw` |
| `REQUEST_CANCELLATION` | `POST /requests/{id}/cancellation` |
| `APPROVE_CANCELLATION` | `POST /requests/{id}/cancellation/approve` |
| `DECLINE_CANCELLATION` | `POST /requests/{id}/cancellation/decline` |
| `CANCEL` | `POST /requests/{id}/cancel` (Admin) |

Detail `timeline` (oldest first):
```json
"timeline": [
  { "status": "PENDING", "previousStatus": null, "actor": { "type": "USER", "id": "uuid", "name": "Lina" }, "source": "USER", "reason": null, "at": "..." },
  { "status": "APPROVED", "previousStatus": "PENDING", "actor": { "type": "USER", "id": "uuid", "name": "Omar" }, "source": "APPROVAL", "reason": null, "at": "..." }
]
```
`actor` can be `{ "type": "SYSTEM", "job": "..." }`. `source`: `USER` | `APPROVAL` | `SYSTEM_JOB`.

### `POST /requests` — auth (submit)

```json
{
  "type": "WFH",
  "startDate": "2026-11-02",
  "endDate": "2026-11-03",
  "startTime": null,
  "endTime": null,
  "reason": "optional, ≤1000",
  "data": {},
  "employeeId": "uuid (Admin only: submit for someone)",
  "approved": false
}
```
- `endDate` defaults to `startDate`. Max 366 days.
- `employeeId` ≠ you → Admin only (`403` otherwise). `approved: true` → Admin + on-behalf only; records it as already APPROVED (effects apply immediately).
- → `201` request **detail** (with `timeline`).

Errors:
- `422`: `type UNKNOWN_REFERENCE`, `endDate OUT_OF_RANGE` (single-day type with different end, end < start, > 366 days), `startTime INVALID_FORMAT` (times on a NONE type / not HH:mm), `startTime|endTime REQUIRED`, `endTime OUT_OF_RANGE` (≤ start), `reason REQUIRED`, `data.<field> ...`, `approved INVALID_FORMAT` (approved on own request), plus type-specific ones above.
- `409 REQUEST_TYPE_DISABLED`, `409 REQUEST_OVERLAP`, `409 INSUFFICIENT_BALANCE` (leave).
- `403 FORBIDDEN` (non-Admin on behalf), `404` (employee not found).

### Lists

**`GET /requests/mine`** — your own requests.
**`GET /requests/approvals`** — Manager/Admin (Employee → 403). Requests you decide. Default statuses `PENDING` + `CANCELLATION_REQUESTED`. Manager: active direct reports, excluding Admin-only types. Admin: everyone except themselves (themselves too if they're the only Admin).

Query (both): pagination (`sort` ∈ `createdAt` (default `-createdAt`), `startDate`), `type` (multi), `status` (multi), `employeeId`, `from`, `to` (requests **overlapping** from–to).
→ `200 { items: Request[], meta }` (no `timeline` in lists).

Tip for an approvals inbox ordered oldest first: `sort=createdAt`.

### `GET /requests/{id}` — auth

Requester, their manager (if active direct report), or Admin → `200` detail. Else `404`.

### Actions — all `POST`, all return `200` request detail

| Endpoint | Who | Body | From → To |
|---|---|---|---|
| `/requests/{id}/approve` | decider | `{ "comment"?: string ≤1000 }` | PENDING → APPROVED |
| `/requests/{id}/reject` | decider | `{ "reason": string }` **required** | PENDING → REJECTED |
| `/requests/{id}/withdraw` | requester | none / `{}` | PENDING → WITHDRAWN |
| `/requests/{id}/cancellation` | requester | `{ "reason"?: string }` | APPROVED → CANCELLATION_REQUESTED (only before `startDate`; `409 REQUEST_STARTED` otherwise) |
| `/requests/{id}/cancellation/approve` | decider | `{ "comment"?: string }` | CANCELLATION_REQUESTED → CANCELLED |
| `/requests/{id}/cancellation/decline` | decider | `{ "comment"?: string }` | CANCELLATION_REQUESTED → APPROVED |
| `/requests/{id}/cancel` | Admin | `{ "reason": string }` **required** | APPROVED / CANCELLATION_REQUESTED → CANCELLED (even if started) |

Errors: `409 REQUEST_STATUS_CONFLICT` (wrong current status / someone acted first → refetch), `403 SELF_APPROVAL`, `403 FORBIDDEN` ("Only the requester can withdraw", non-decider, non-Admin cancel), `422 reason REQUIRED`, `404`.

Effects: leave balances reserved/deducted/released/restored automatically; attendance days recalculated (e.g. past ABSENT → ON_LEAVE after approval); corrections applied on approval.

---

## 10. Leave requests

Leave is submitted through **`POST /requests`** with `type: "LEAVE"`:
```json
{
  "type": "LEAVE",
  "startDate": "2026-11-02",
  "endDate": "2026-11-04",
  "reason": "optional unless the leave type requires it",
  "data": { "leaveTypeId": "uuid", "firstDayHalf": null, "lastDayHalf": "MORNING" }
}
```

**Half days**:
- Single day: `firstDayHalf: "MORNING" | "AFTERNOON"` (0.5 day). `lastDayHalf` not allowed.
- Range: may start at noon (`firstDayHalf: "AFTERNOON"` only) and/or end at noon (`lastDayHalf: "MORNING"` only).
- Only if the type has `halfDaysAllowed`.

**Day count**: working days only; weekends and holidays are excluded.

**Refused when**:
| Rule | Error |
|---|---|
| unknown or archived leave type | `422 data.leaveTypeId UNKNOWN_REFERENCE` |
| type requires a reason | `422 reason REQUIRED` |
| half day not allowed / bad half combo | `422 data.firstDayHalf|data.lastDayHalf INVALID_FORMAT|OUT_OF_RANGE` |
| more than 30 days in the past (Admins on behalf exempt) | `422 startDate OUT_OF_RANGE` |
| beyond end of next leave year | `422 endDate OUT_OF_RANGE` |
| crosses two leave years | `422 endDate CROSSES_LEAVE_YEAR` (split it) |
| no working day in range | `422 endDate NO_WORKING_DAYS` |
| overlaps own pending/approved leave, WFH or business trip | `409 REQUEST_OVERLAP` |
| not enough balance (unless type allows negative / untracked) | `409 INSUFFICIENT_BALANCE` |

Field errors are returned first (all of them together); otherwise the first conflict.

### `POST /leave/requests/preview` — auth

Same rules, saves nothing, returns **every** problem. Call it as the form changes.

Body:
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2026-11-02",
  "endDate": "2026-11-04",
  "firstDayHalf": null,
  "lastDayHalf": null,
  "reason": null,
  "employeeId": "uuid (Admin only, for someone else)"
}
```
Note: fields are **top-level** here (not under `data`). `endDate` defaults to `startDate`; `endDate < startDate` → `422 endDate OUT_OF_RANGE`. Non-Admin with someone else's `employeeId` → `403`.

→ `200`:
```json
{
  "leaveType": { "id": "uuid", "name": "Annual" },
  "days": 2.5,
  "workingDays": [ { "date": "2026-11-02", "days": 1 }, { "date": "2026-11-03", "days": 1 }, { "date": "2026-11-04", "days": 0.5 } ],
  "excluded": [ { "date": "2026-11-06", "reason": "WEEKEND", "holiday": null } ],
  "balance": { "tracked": true, "year": 2026, "available": 11.5, "availableAfter": 9 },
  "problems": [ { "code": "INSUFFICIENT_BALANCE", "field": null, "message": "Only 1 day(s) available" } ],
  "conflicts": [ { "requestId": "uuid", "type": "WFH", "startDate": "...", "endDate": "...", "status": "APPROVED" } ],
  "teamOff": [
    { "employeeId": "uuid", "name": "Omar", "startDate": "2026-11-01", "endDate": "2026-11-05" },
    { "employeeId": "uuid", "name": "Sara" }
  ]
}
```
- `problems[].code` is a field code (`field` set) or an error code (`field: null`: `REQUEST_OVERLAP`, `INSUFFICIENT_BALANCE`). Empty → submit will pass (balance rechecked under lock at submit).
- `balance` is `null` if the leave type is invalid; for untracked types `available`/`availableAfter` are `null`.
- `excluded[].reason`: `WEEKEND` | `HOLIDAY` (+ holiday name).
- `teamOff`: others with approved leave overlapping the range, filtered by privacy — entries **without** dates are colleagues you only see as "Out".

### `GET /leave/employees/{employeeId}/requests` — auth

Leave history for self / team / Admin. Query: pagination (`sort` ∈ `startDate` (default `-startDate`), `createdAt`), `status` (multi), `from`, `to`.
→ `{ items: Request[], meta }` (only `type: LEAVE`).

---

## 11. Calendar & availability

Read-only, every role. Range ≤ 92 days (`422 to OUT_OF_RANGE`).

### `GET /calendar/events`

Query:
| Param | Notes |
|---|---|
| `from`, `to` | required PlainDate |
| `departmentId` | filter |
| `team` | `true` → only your direct reports |
| `employeeId` | filter |
| `type` | multi: `LEAVE`, `WFH`, `BUSINESS_TRIP`, `PERMISSION`, `HOLIDAY` |
| `includePending` | `true` → adds PENDING requests as `tentative: true` (only for people you see in detail) |

→ `{ "from", "to", "events": CalendarEvent[] }` sorted by start date (holidays first on the same day). Three event shapes — switch on the shape:

```json
// holiday
{ "kind": "HOLIDAY", "id": "uuid", "name": "National Day", "startDate": "...", "endDate": "..." }

// full detail (self, Manager's reports, everyone for Admin)
{
  "kind": "LEAVE", "requestId": "uuid", "tentative": false,
  "employee": { "id": "uuid", "name": "Lina" },
  "startDate": "...", "endDate": "...", "startTime": null, "endTime": null,
  "reason": "...", "leaveType": { "id": "uuid", "name": "Annual" },
  "destination": null, "purpose": null
}

// colleague (Employee viewers, same department only, approved leave/WFH only)
{ "kind": "OUT", "colleague": true, "employee": { "id": "uuid", "name": "Omar" }, "startDate": "...", "endDate": "..." }
{ "kind": "WFH", "colleague": true, "employee": {...}, "startDate": "...", "endDate": "..." }
```
Detailed `kind` ∈ `LEAVE`, `WFH`, `BUSINESS_TRIP`, `PERMISSION`. `leaveType` set only for LEAVE; `destination`/`purpose` for trips; `startTime`/`endTime` for permissions. Includes APPROVED and CANCELLATION_REQUESTED; never rejected/withdrawn/cancelled. Attendance actuals (late/absent) are not in the calendar.

### `GET /calendar/availability`

Same `from`, `to`, `departmentId`, `team`, `employeeId`.
```json
{
  "from": "...", "to": "...",
  "days": [
    { "date": "2026-11-02", "working": true, "holiday": null, "total": 12, "out": 2, "wfh": 3, "inOffice": 7 }
  ]
}
```
`total` = people in scope expected that day (joined, not past last day, not invited). Non-working days have `total: 0`. `out` = leave or (visible) business trip. A colleague's trip counts as in-office for Employees.

---

## 12. Dashboards

All attendance numbers use the same engine as attendance views and reports (they always agree). "Today" buckets count people **expected today**; on a working day they sum to `expected`. Before the day closes, nobody is absent — no check-in = `notYetCheckedIn`. `MISSING_CHECKOUT` counts as `present`.

### `GET /dashboard/employee` — auth (any role)

```json
{
  "today": {
    "date": "2026-10-11", "status": "PRESENT", "flags": [], "expected": true,
    "firstCheckInAt": "...", "lastCheckOutAt": null,
    "openSession": { "id": "uuid", "checkInAt": "..." },
    "workedMinutes": 135
  },
  "balances": [ { "leaveType": { ...Balance.leaveType }, "available": 11.5, "pending": 2 } ],
  "pendingRequests": { "total": 1, "items": [ Request ] },
  "upcoming": [ { "requestId": "uuid", "type": "LEAVE", "employee": { "id", "name" }, "startDate": "...", "endDate": "..." } ],
  "recentActivity": [
    { "action": "request.statusChanged", "recordType": "REQUEST", "recordId": "uuid", "at": "...",
      "actor": { "type": "USER", "id": "uuid", "name": "Omar" }, "reason": null }
  ]
}
```
- `today.workedMinutes` already includes the open session up to now.
- `balances`: tracked types only. `pendingRequests.items` ≤ 10 newest. `upcoming`: approved LEAVE/WFH/BUSINESS_TRIP in the next 30 days. `recentActivity`: last 10 history entries about you (see [§14](#14-history-audit-trail) for action names).

### `GET /dashboard/manager` — Manager or Admin

```json
{
  "date": "2026-10-11",
  "pendingApprovals": { "total": 4, "oldestFirst": [ Request ] },
  "teamToday": {
    "working": true, "expected": 6,
    "counts": { "present": 3, "late": 1, "absent": 0, "wfh": 1, "onLeave": 1, "businessTrip": 0, "notYetCheckedIn": 0 },
    "people": { "present": [ { "id": "uuid", "name": "Lina" } ], "late": [], "absent": [], "wfh": [], "onLeave": [], "businessTrip": [], "notYetCheckedIn": [] }
  },
  "teamOutNext14Days": [ { "requestId", "type", "employee": { "id", "name" }, "startDate", "endDate" } ],
  "teamThisMonth": { "late": 3, "absences": 1, "missingCheckouts": 2 }
}
```
Team = the caller's direct reports. `pendingApprovals.oldestFirst` ≤ 10. `teamThisMonth` covers the 1st of the month up to yesterday.

### `GET /dashboard/admin` — Admin

```json
{
  "date": "2026-10-11",
  "companyToday": { "working": true, "expected": 120, "counts": { ...same 7 buckets } },
  "pendingRequests": [
    { "type": "LEAVE", "label": "Leave", "count": 7, "overdue": 2, "oldestSubmittedAt": "...", "oldestAgeDays": 5 }
  ],
  "exceptionsThisMonth": { "missingCheckouts": 4, "absences": 6 },
  "leaveUsage": {
    "year": 2026,
    "items": [ { "leaveType": { "id", "name", "icon" }, "entitled": 2520, "used": 800, "upcoming": 120, "pending": 40 } ]
  },
  "attendanceTrend": [
    { "date": "2026-09-11", "working": true, "present": 100, "late": 8, "absent": 3, "wfh": 9 }
  ]
}
```
- `companyToday` has **no** `people` names (counts only).
- `overdue` = pending more than 3 days.
- `attendanceTrend` = last 30 days up to yesterday (non-working days included with `working: false`).

---

## 13. Reports & CSV export

Six reports. Each endpoint returns JSON (one page) by default, or the **full CSV file** with `format=csv`.

### Common query params

| Param | Notes |
|---|---|
| `format` | `json` (default) \| `csv` |
| `scope` | `self` \| `team` \| `company`. Default = widest for role (Admin company, Manager team, Employee self). Not allowed for role → 403. |
| `departmentId`, `managerId`, `employeeId` | filters. Employees using any filter except their own `employeeId` → 403. Employee outside scope → 404. |
| `employeeStatus` | multi `INVITED`/`ACTIVE`/`DEACTIVATED` (current account status) |
| `page`, `pageSize`, `sort` | JSON only (sort fields per report below) |
| `preset` | `THIS_MONTH` \| `LAST_MONTH` \| `THIS_LEAVE_YEAR` (company calendar) |
| `from`, `to` | custom range instead of preset (both required; ≤ 13 months). Using both preset and from/to → `422 preset INVALID_FORMAT`. Missing → `422 from/to REQUIRED`. Too long / reversed → `422 to OUT_OF_RANGE`. |

Who's included: people in scope employed at some point in the range (joined by its end, last working day on/after its start). Attendance reports list attendance-tracked people only.

### JSON envelope

```json
{
  "from": "2026-03-01", "to": "2026-03-31",
  "scope": "company",
  "timezone": "Asia/Dubai",
  "totals": { ... },
  "items": [ ... ],
  "meta": { ... }
}
```
`totals` only on summaries (sum over **all** rows, not the page). Leave balances returns `year` and `period: { start, end }` instead of `from/to`.

### CSV

`Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="attendance-summary_2026-03-01_2026-03-31_Asia-Dubai.csv"`. UTF-8 with BOM (Excel-safe Arabic), CRLF, ISO dates, check-in/out as company-time `HH:mm`, labels like "On Leave". Cells starting with `= + - @` are prefixed with `'`.

Download through your server (needs the bearer token), then stream to the browser:
```ts
const res = await fetch(`${API}/reports/attendance/summary?preset=THIS_MONTH&format=csv`, { headers: { Authorization: `Bearer ${t}` } })
// forward res.body + Content-Disposition to the client
```

Common row bits: `employee: { id, name, employeeCode }`, `department: { id, name } | null`.

### `GET /reports/attendance/summary`

Range: preset or from/to. Sort: `name` (default), `department`, or any numeric column.
Row:
```json
{
  "employee": {...}, "department": {...},
  "workingDays": 22, "present": 15, "late": 2, "absent": 1, "wfh": 2, "onLeave": 1,
  "unpaidLeaveDays": 0, "businessTrip": 0, "missingCheckouts": 1, "notYetRecorded": 0,
  "holidays": 1, "workedMinutes": 8400, "workedHours": 140, "corrections": 1
}
```
`present + late + absent + wfh + onLeave + businessTrip + missingCheckouts + notYetRecorded = workingDays`. `notYetRecorded` = today before check-in, or future days. `unpaidLeaveDays` from approved leave of unpaid types. `totals` has the same numeric keys.

### `GET /reports/attendance/detail`

Employee × day (every day employed in range, weekends/holidays included), by name then date. Sort: `name`. Pagination is over rows.
Row:
```json
{
  "employee": {...}, "department": {...},
  "date": "2026-03-01", "weekday": "SUN",
  "status": "LATE", "flags": [], "firstCheckInAt": "...", "lastCheckOutAt": "...",
  "workedMinutes": 480, "workedHours": 8, "corrected": false
}
```

### `GET /reports/leave/balances`

Range: `year` (leave year, optional, default current) instead of preset/from/to. Extra: `leaveTypeId` (multi). Sort: `name`.
Row:
```json
{
  "employee": {...}, "department": {...},
  "leaveType": { "id", "name", "paid": true, "tracksBalance": true },
  "year": 2026,
  "entitlement": 21, "adjustments": 0, "used": 5, "upcoming": 2, "pending": 1, "available": 13
}
```
Untracked types: `entitlement`, `adjustments`, `available` are `null` (used/upcoming/pending still shown from requests). People without a balance yet show the pro-rated default (nothing is created).

### `GET /reports/leave/register`

One row per leave request overlapping the range (any status unless filtered). Extra: `status` (multi), `leaveTypeId` (multi). Sort: `startDate` (default), `name`, `status`.
Row:
```json
{
  "requestId": "uuid", "employee": {...}, "department": {...},
  "startDate": "...", "endDate": "...",
  "days": 3, "daysInRange": 2,
  "status": "APPROVED",
  "submittedAt": "...", "approver": { "id", "name" }, "decidedAt": "...", "cancelledAt": null,
  "leaveType": { "id", "name", "paid": true },
  "firstDayHalf": null, "lastDayHalf": null
}
```

### `GET /reports/wfh/summary`

Sort: `name`, `department`, `wfhDays`, `approved`, `rejected`, `pending`.
Row: `{ employee, department, wfhDays, approved, rejected, pending }` — `wfhDays` = approved WFH working days in range; others = counts of WFH requests overlapping the range (`approved` includes CANCELLATION_REQUESTED). `totals` included.

### `GET /reports/wfh/register`

Extra: `status` (multi), `type` (multi `WFH` | `BUSINESS_TRIP`, default `WFH`). Sort: `startDate`, `name`, `status`.
Row: register base fields (as leave register, without leave fields) + `type`.

---

## 14. History (audit trail)

### `GET /history/{recordType}/{id}` — auth

`recordType` ∈:
| `recordType` | `id` is | Who can read |
|---|---|---|
| `attendance-days` | `DayView.recordId` | whoever can view that employee's attendance |
| `leave-balances` | `Balance.balanceId` | whoever can view that employee's leave |
| `requests` | request id | whoever can view the request |
| `employees` | employee id | whoever can view the profile |
| `company-settings` | **your company id** (`/me.company.id`) | everyone |

Records with no history (attendance/balance/request) → `404`. Pagination; `sort=at` or `-at` (default newest first).

```json
{
  "items": [
    {
      "id": "uuid",
      "action": "attendance.corrected",
      "at": "2026-10-11T10:00:00.000Z",
      "actor": { "type": "USER", "id": "uuid", "name": "HR Admin" },
      "source": "USER",
      "oldValues": { "status": "ABSENT", "sessions": [] },
      "newValues": { "status": "PRESENT", "sessions": [ ... ] },
      "reason": "Forgot to check in"
    }
  ],
  "meta": {...}
}
```
`actor` may be `{ "type": "SYSTEM", "job": "attendance.nightlyClose" }`. `oldValues`/`newValues` contain only changed fields.

Actions (translate by key):
- Attendance: `attendance.recorded`, `attendance.corrected`, `attendance.closed`
- Leave balance: `leaveBalance.changed`, `leaveBalance.adjusted`, `leaveBalance.entitlementSet`
- Requests: `request.statusChanged`
- Employee: `employee.created`, `employee.profileChanged`, `employee.roleChanged`, `employee.reportingLineChanged`, `employee.statusChanged`, `employee.photoChanged`
- Company settings (incl. holidays, leave types, departments): `companySettings.changed`, `holiday.added|changed|removed`, `leaveType.added|changed|removed`, `department.added|renamed|removed`. For holidays/departments/leave types the value keys look like `"holiday:{id}": { name, startDate, endDate }`, `"department:{id}": { name }`.

---

## 15. Health

`GET /health` — no auth → `200 { "status": "OK", "database": "UP" }` or `503 { "status": "DEGRADED", "database": "DOWN" }`.

---

## 16. Enum & code cheat sheet

```
Role:            EMPLOYEE | MANAGER | ADMIN
UserStatus:      INVITED | ACTIVE | DEACTIVATED
Locale:          en | ar
Weekday:         SUN | MON | TUE | WED | THU | FRI | SAT
EmploymentType:  FULL_TIME | PART_TIME | CONTRACTOR
AttendanceStatus: PRESENT | LATE | ABSENT | WFH | ON_LEAVE | BUSINESS_TRIP | HOLIDAY | WEEKEND | MISSING_CHECKOUT
AttendanceFlag:  WORKED_ON_NON_WORKING_DAY | WORKED_DURING_TIME_OFF | CORRECTED | WFH_NO_CHECK_IN
SessionSource:   SELF | CORRECTION
LeaveIcon:       annual | sick | emergency | unpaid | maternity | paternity | bereavement | marriage | hajj | study | other
EntitlementSource: DEFAULT | PRORATED | OVERRIDE
LedgerEntryType: ALLOWANCE | ADJUSTMENT | RESERVATION | RELEASE | DEDUCTION | RESTORATION
Half:            MORNING | AFTERNOON
RequestType:     LEAVE | WFH | PERMISSION | BUSINESS_TRIP | ATTENDANCE_CORRECTION
RequestStatus:   PENDING | APPROVED | REJECTED | WITHDRAWN | CANCELLATION_REQUESTED | CANCELLED
RequestAction:   APPROVE | REJECT | WITHDRAW | REQUEST_CANCELLATION | APPROVE_CANCELLATION | DECLINE_CANCELLATION | CANCEL
ApproverPolicy:  MANAGER_WITH_ADMIN_FALLBACK | ADMIN_ONLY
CalendarEventKind: LEAVE | WFH | BUSINESS_TRIP | PERMISSION | HOLIDAY  (+ colleague OUT | WFH)
ReportScope:     self | team | company
RangePreset:     THIS_MONTH | LAST_MONTH | THIS_LEAVE_YEAR
HistorySource:   USER | APPROVAL | SYSTEM_JOB
```

Error codes (`code`):
```
VALIDATION_FAILED, INVALID_CREDENTIALS, ACCOUNT_DEACTIVATED, TOO_MANY_ATTEMPTS, UNAUTHENTICATED,
SESSION_EXPIRED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_ERROR, TOKEN_INVALID, TOKEN_EXPIRED,
SELF_APPROVAL, DEPARTMENT_NOT_EMPTY, HAS_DIRECT_REPORTS, LAST_ADMIN, ATTENDANCE_NOT_TRACKED,
NO_OPEN_SESSION, LEAVE_TYPE_IN_USE, LEAVE_TYPE_NOT_TRACKED, INSUFFICIENT_BALANCE,
REQUEST_STATUS_CONFLICT, REQUEST_STARTED, REQUEST_OVERLAP, REQUEST_TYPE_DISABLED
```

Field error codes (`fieldErrors[].code`):
```
REQUIRED, INVALID_FORMAT, TOO_SHORT, TOO_LONG, OUT_OF_RANGE, ALREADY_EXISTS, TOO_COMMON,
CONTAINS_PERSONAL_INFO, INCORRECT, FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE, UNKNOWN_REFERENCE,
SELF_MANAGER, NOT_A_MANAGER, MANAGER_LOOP, NO_WORKING_DAYS, CROSSES_LEAVE_YEAR
```

Suggested English copy for the 409 codes:
| Code | Copy |
|---|---|
| `DEPARTMENT_NOT_EMPTY` | Move this department's employees first. |
| `HAS_DIRECT_REPORTS` | Choose a new manager for their direct reports first. |
| `LAST_ADMIN` | The company needs at least one Admin. |
| `ATTENDANCE_NOT_TRACKED` | Attendance isn't tracked for you. |
| `NO_OPEN_SESSION` | You haven't checked in. |
| `LEAVE_TYPE_IN_USE` | This leave type has been used; archive it instead. |
| `LEAVE_TYPE_NOT_TRACKED` | This leave type has no balance. |
| `INSUFFICIENT_BALANCE` | Not enough leave balance. |
| `REQUEST_STATUS_CONFLICT` | Someone already acted on this request. Refresh. |
| `REQUEST_STARTED` | It has started; ask HR to cancel it. |
| `REQUEST_OVERLAP` | Overlaps another request; withdraw or cancel that first. |
| `REQUEST_TYPE_DISABLED` | This request type is turned off. |

---

## 17. TypeScript types

```ts
// ── primitives ──
export type UUID = string
export type PlainDate = string // "YYYY-MM-DD"
export type Instant = string   // ISO UTC "…Z"
export type LocalTime = string // "HH:mm"

export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN"
export type UserStatus = "INVITED" | "ACTIVE" | "DEACTIVATED"
export type Locale = "en" | "ar"
export type Weekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACTOR"

export type PageMeta = { page: number; pageSize: number; totalItems: number; totalPages: number }
export type Page<T> = { items: T[]; meta: PageMeta }
export type Ref = { id: UUID; name: string }
export type NullableRef = { id: UUID; name: string | null }

export type FieldError = { field: string; code: string; message: string }
export type ApiErrorBody = { code: string; message: string; fieldErrors?: FieldError[] }

export type Actor =
  | { type: "USER"; id: UUID; name: string | null }
  | { type: "SYSTEM"; job: string | null }

// ── auth ──
export type AuthTokens = { accessToken: string; refreshToken: string; expiresIn: number }
export type CompanyBasics = { id: UUID; name: string; timezone: string; weekStart: Weekday; workingDays: Weekday[] }
export type Me = {
  id: UUID; name: string; email: string; role: Role; status: UserStatus; locale: Locale
  employee: Ref; company: CompanyBasics
}

// ── organization ──
export type CompanySettings = {
  name: string; timezone: string; timezoneEffectiveFrom: PlainDate | null
  weekStart: Weekday; workingDays: Weekday[]
  workStartTime: LocalTime; workEndTime: LocalTime; lateGraceMinutes: number
  leaveYearStartMonth: number; disabledRequestTypes: string[]; logoUrl: string | null
}
export type Holiday = { id: UUID; name: string; startDate: PlainDate; endDate: PlainDate }
export type AffectedRequest = {
  requestId: UUID; employeeId: UUID; employeeName: string; type: string
  startDate: PlainDate; endDate: PlainDate
}
export type HolidayResult = { holiday: Holiday; affectedRequests: AffectedRequest[] }
export type CalendarDay = { date: PlainDate; weekday: Weekday; working: boolean; holiday: { id: UUID; name: string } | null }
export type WorkCalendar = { from: PlainDate; to: PlainDate; workingDayCount: number; days: CalendarDay[] }
export type Department = { id: UUID; name: string; employeeCount: number }

export type EmployeeProfile = {
  id: UUID; name: string; email: string
  phone: string | null; jobTitle: string | null; employeeCode: string | null
  department: Ref | null; manager: Ref | null
  role: Role; status: UserStatus
  joiningDate: PlainDate | null; employmentType: EmploymentType; tracksAttendance: boolean
  lastWorkingDay: PlainDate | null; photoUrl: string | null
}
export type ImportReport = {
  createdCount: number
  created: { row: number; id: UUID; email: string }[]
  errors: (FieldError & { row: number })[]
}
export type OffboardingItem = { id: UUID; type: string; startDate: PlainDate; endDate: PlainDate }
export type DeactivationPreview = {
  lastWorkingDay: PlainDate; directReports: Ref[]
  pendingRequests: OffboardingItem[]; futureApprovedTimeOff: OffboardingItem[]
}

// ── attendance ──
export type AttendanceStatus =
  | "PRESENT" | "LATE" | "ABSENT" | "WFH" | "ON_LEAVE" | "BUSINESS_TRIP" | "HOLIDAY" | "WEEKEND" | "MISSING_CHECKOUT"
export type AttendanceFlag = "WORKED_ON_NON_WORKING_DAY" | "WORKED_DURING_TIME_OFF" | "CORRECTED" | "WFH_NO_CHECK_IN"
export type DayView = {
  recordId: UUID | null; date: PlainDate; status: AttendanceStatus | null; flags: AttendanceFlag[]
  firstCheckInAt: Instant | null; lastCheckOutAt: Instant | null; workedMinutes: number
}
export type SessionView = {
  id: UUID; checkInAt: Instant; checkOutAt: Instant | null; autoClosedAt: Instant | null
  source: "SELF" | "CORRECTION"
  // Admin only:
  checkInIp?: string | null; checkInUserAgent?: string | null
  checkOutIp?: string | null; checkOutUserAgent?: string | null
}
export type Today = DayView & {
  expected: boolean; tracksAttendance: boolean
  openSession: { id: UUID; checkInAt: Instant } | null
  sessions: SessionView[]
}
export type AttendanceGrid = { from: PlainDate; to: PlainDate } & Page<{ employee: Ref; days: DayView[] }>
export type DayDetail = { employee: Ref; day: DayView; sessions: SessionView[] }
export type AttendanceException = { employee: NullableRef } & DayView

// ── leave ──
export type LeaveIcon =
  | "annual" | "sick" | "emergency" | "unpaid" | "maternity" | "paternity"
  | "bereavement" | "marriage" | "hajj" | "study" | "other"
export type LeaveTypePolicy = {
  name: string; icon: LeaveIcon; paid: boolean; tracksBalance: boolean; defaultAllowanceDays: number
  allowNegativeBalance: boolean; halfDaysAllowed: boolean; requiresReason: boolean
}
export type LeaveType = LeaveTypePolicy & { id: UUID; archived: boolean; inUse: boolean }
export type Balance = {
  balanceId: UUID | null
  leaveType: Pick<LeaveType, "id" | "name" | "icon" | "paid" | "tracksBalance" | "allowNegativeBalance" | "halfDaysAllowed" | "requiresReason">
  year: number; period: { start: PlainDate; end: PlainDate }; tracked: boolean
  proposedEntitlement: number | null; entitlementSource: "DEFAULT" | "PRORATED" | "OVERRIDE" | null
  entitlement: number | null; adjustments: number | null; used: number | null
  upcoming: number | null; pending: number | null; available: number | null
}
export type LedgerEntry = {
  id: UUID
  type: "ALLOWANCE" | "ADJUSTMENT" | "RESERVATION" | "RELEASE" | "DEDUCTION" | "RESTORATION"
  days: number; breakdown: { date: PlainDate; days: number }[] | null
  requestId: UUID | null; reason: string | null; actor: Actor; at: Instant
}
export type Half = "MORNING" | "AFTERNOON"
export type LeavePreview = {
  leaveType: Ref | null; days: number
  workingDays: { date: PlainDate; days: number }[]
  excluded: { date: PlainDate; reason: "WEEKEND" | "HOLIDAY"; holiday: string | null }[]
  balance: { tracked: boolean; year: number; available: number | null; availableAfter: number | null } | null
  problems: { code: string; field: string | null; message: string }[]
  conflicts: { requestId: UUID; type: string; startDate: PlainDate; endDate: PlainDate; status: RequestStatus }[]
  teamOff: ({ employeeId: UUID; name: string } & Partial<{ startDate: PlainDate; endDate: PlainDate }>)[]
}

// ── requests ──
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "CANCELLATION_REQUESTED" | "CANCELLED"
export type RequestAction =
  | "APPROVE" | "REJECT" | "WITHDRAW" | "REQUEST_CANCELLATION" | "APPROVE_CANCELLATION" | "DECLINE_CANCELLATION" | "CANCEL"
export type ApproverPolicy = "MANAGER_WITH_ADMIN_FALLBACK" | "ADMIN_ONLY"
export type FieldMeta = { name: string; kind: "text" | "time" | "choice" | "leaveType"; required: boolean; maxLength?: number; options?: string[] }
export type RequestType = {
  key: string; label: string; enabled: boolean; approverPolicy: ApproverPolicy
  dates: "SINGLE_DAY" | "RANGE"; times: "NONE" | "OPTIONAL" | "REQUIRED"; reason: "OPTIONAL" | "REQUIRED"
  colleagueVisibility: "OUT" | "WFH" | "HIDDEN"; fields: FieldMeta[]
}
export type Request = {
  id: UUID; type: string; typeLabel: string; requester: NullableRef
  startDate: PlainDate; endDate: PlainDate; startTime: LocalTime | null; endTime: LocalTime | null
  reason: string | null; data: Record<string, unknown>; status: RequestStatus
  approverPolicy: ApproverPolicy | null; createdBy: NullableRef
  createdAt: Instant | null; submittedAt: Instant | null
  decision: { by: NullableRef; at: Instant | null; comment: string | null; selfApproved: boolean } | null
  cancellation: { requestedAt: Instant | null; reason: string | null; cancelledBy: NullableRef | null; cancelledAt: Instant | null } | null
  actions: RequestAction[]
}
export type RequestDetail = Request & {
  timeline: {
    status: RequestStatus | null; previousStatus: RequestStatus | null; actor: Actor
    source: "USER" | "APPROVAL" | "SYSTEM_JOB"; reason: string | null; at: Instant
  }[]
}
export type SubmitRequestBody = {
  type: string; startDate: PlainDate; endDate?: PlainDate
  startTime?: LocalTime | null; endTime?: LocalTime | null; reason?: string | null
  data?: Record<string, unknown>; employeeId?: UUID; approved?: boolean
}

// ── calendar ──
export type CalendarEvent =
  | { kind: "HOLIDAY"; id: UUID; name: string; startDate: PlainDate; endDate: PlainDate }
  | {
      kind: "LEAVE" | "WFH" | "BUSINESS_TRIP" | "PERMISSION"; requestId: UUID; tentative: boolean; employee: Ref
      startDate: PlainDate; endDate: PlainDate; startTime: LocalTime | null; endTime: LocalTime | null
      leaveType?: Ref | null; reason?: string | null; destination?: string | null; purpose?: string | null
    }
  | { kind: "OUT" | "WFH"; colleague: true; employee: Ref; startDate: PlainDate; endDate: PlainDate }
export type DayAvailability = {
  date: PlainDate; working: boolean; holiday: string | null
  total: number; out: number; wfh: number; inOffice: number
}

// ── dashboards ──
export type TodayBuckets = Record<"present" | "late" | "absent" | "wfh" | "onLeave" | "businessTrip" | "notYetCheckedIn", number>
export type UpcomingItem = { requestId: UUID; type: string; employee: NullableRef; startDate: PlainDate; endDate: PlainDate }
export type EmployeeDashboard = {
  today: Pick<Today, "date" | "status" | "flags" | "expected" | "firstCheckInAt" | "lastCheckOutAt" | "openSession" | "workedMinutes">
  balances: { leaveType: Balance["leaveType"]; available: number | null; pending: number | null }[]
  pendingRequests: { total: number; items: Request[] }
  upcoming: UpcomingItem[]
  recentActivity: { action: string; recordType: string; recordId: UUID; at: Instant; actor: Actor; reason: string | null }[]
}
export type ManagerDashboard = {
  date: PlainDate
  pendingApprovals: { total: number; oldestFirst: Request[] }
  teamToday: { working: boolean; expected: number; counts: TodayBuckets; people: Record<keyof TodayBuckets, Ref[]> }
  teamOutNext14Days: UpcomingItem[]
  teamThisMonth: { late: number; absences: number; missingCheckouts: number }
}
export type AdminDashboard = {
  date: PlainDate
  companyToday: { working: boolean; expected: number; counts: TodayBuckets }
  pendingRequests: { type: string; label: string; count: number; overdue: number; oldestSubmittedAt: Instant | null; oldestAgeDays: number | null }[]
  exceptionsThisMonth: { missingCheckouts: number; absences: number }
  leaveUsage: { year: number; items: { leaveType: { id: UUID; name: string; icon: LeaveIcon }; entitled: number; used: number; upcoming: number; pending: number }[] }
  attendanceTrend: { date: PlainDate; working: boolean; present: number; late: number; absent: number; wfh: number }[]
}

// ── reports ──
export type EmployeeRef = { id: UUID; name: string; employeeCode: string | null }
export type ReportEnvelope<Row, Extra = { from: PlainDate; to: PlainDate }> = Extra & {
  scope: "self" | "team" | "company"; timezone: string; totals?: Record<string, number>
} & Page<Row>
type RowBase = { employee: EmployeeRef; department: NullableRef | null }
export type AttendanceSummaryRow = RowBase & Record<
  "workingDays" | "present" | "late" | "absent" | "wfh" | "onLeave" | "unpaidLeaveDays" | "businessTrip"
  | "missingCheckouts" | "notYetRecorded" | "holidays" | "workedMinutes" | "workedHours" | "corrections", number>
export type AttendanceDetailRow = RowBase & {
  date: PlainDate; weekday: string; status: AttendanceStatus | null; flags: AttendanceFlag[]
  firstCheckInAt: Instant | null; lastCheckOutAt: Instant | null; workedMinutes: number; workedHours: number; corrected: boolean
}
export type LeaveBalanceRow = RowBase & {
  leaveType: { id: UUID; name: string; paid: boolean; tracksBalance: boolean }; year: number
  entitlement: number | null; adjustments: number | null; used: number; upcoming: number; pending: number; available: number | null
}
type RegisterBase = RowBase & {
  requestId: UUID; startDate: PlainDate; endDate: PlainDate; days: number; daysInRange: number
  status: RequestStatus; submittedAt: Instant | null; approver: NullableRef | null; decidedAt: Instant | null; cancelledAt: Instant | null
}
export type LeaveRegisterRow = RegisterBase & {
  leaveType: { id: UUID; name: string | null; paid: boolean | null }; firstDayHalf: Half | null; lastDayHalf: Half | null
}
export type WfhSummaryRow = RowBase & { wfhDays: number; approved: number; rejected: number; pending: number }
export type WfhRegisterRow = RegisterBase & { type: string }

// ── history ──
export type HistoryEntry = {
  id: UUID; action: string; at: Instant; actor: Actor
  source: "USER" | "APPROVAL" | "SYSTEM_JOB"
  oldValues: Record<string, unknown>; newValues: Record<string, unknown>; reason: string | null
}
```

---

## 18. Screen → endpoint map

| Screen | Calls |
|---|---|
| Signup | `POST /auth/signup` |
| Login | `POST /auth/login` |
| Forgot / reset password | `POST /auth/password/forgot` → `POST /auth/password/reset/verify` (on load) → `POST /auth/password/reset` |
| Accept invite | `POST /auth/invitations/verify` (on load) → `POST /auth/invitations/accept` |
| App shell | `GET /me`, `GET /company/settings` (logo, hours) |
| Employee home | `GET /dashboard/employee`, `POST /attendance/check-in|check-out` |
| Manager home | `GET /dashboard/manager` (+ employee dashboard for own data) |
| Admin home | `GET /dashboard/admin` |
| My attendance | `GET /attendance/today`, `GET /attendance/month?month=` (scope self = yourself), `GET /attendance/employees/{me}/days/{date}` |
| Team / company attendance | `GET /attendance/days?date=`, `GET /attendance/month?month=` with `departmentId`/`employeeId` |
| Attendance exceptions (HR) | `GET /attendance/exceptions` → corrections endpoints |
| Day detail + corrections (HR) | `GET /attendance/employees/{id}/days/{date}`, `POST …/sessions`, `PATCH|DELETE /attendance/sessions/{id}`, `GET /history/attendance-days/{recordId}` |
| My leave | `GET /leave/employees/{me}/balances`, `GET /leave/employees/{me}/requests` |
| New leave request | `GET /leave/types`, `GET /company/calendar` (picker), `POST /leave/requests/preview` (live), `POST /requests` |
| Other requests (WFH, trip, permission, correction) | `GET /requests/types` (form), `POST /requests` |
| My requests | `GET /requests/mine`, `GET /requests/{id}`, action endpoints |
| Approvals inbox | `GET /requests/approvals`, `GET /requests/{id}`, approve/reject/cancellation decisions |
| Team calendar | `GET /calendar/events`, `GET /calendar/availability` |
| Employee directory | `GET /employees`, `GET /departments` (filter) |
| Employee profile | `GET /employees/{id}`, `PATCH /employees/{id}`, `PUT|DELETE /employees/{id}/photo`, `GET /leave/employees/{id}/balances`, `GET /history/employees/{id}` |
| Add / import employees | `POST /employees`, `POST /employees/import`, `POST /employees/{id}/invitation` |
| Offboarding | `POST /employees/{id}/deactivation/preview` → `POST /employees/{id}/deactivation`; `POST /employees/{id}/reactivation` |
| Balance admin | `GET …/balances/{typeId}/entries`, `POST …/adjustments`, `PUT …/entitlement` |
| Settings: company | `GET|PATCH /company/settings`, `PUT|DELETE /company/logo`, `GET /history/company-settings/{companyId}` |
| Settings: holidays | `GET|POST /company/holidays`, `PATCH|DELETE /company/holidays/{id}` |
| Settings: departments | `GET|POST /departments`, `PATCH|DELETE /departments/{id}` |
| Settings: leave types | `GET /leave/types?includeArchived=true`, `POST|PATCH|DELETE /leave/types/{id}` |
| Settings: request types | `GET /requests/types?includeDisabled=true`, `PATCH /company/settings { disabledRequestTypes }` |
| Reports | `GET /reports/...` (JSON for table, `format=csv` for export) |
| Profile / security | `POST /me/password`, `PATCH /employees/{me} { phone }`, `PUT /employees/{me}/photo` |

---

## 19. Gotchas

1. **No CORS** — call the API server-side (or via same-origin proxy).
2. **`/files/...` URLs are relative** — prefix with the API base URL (or proxy). They expire (≥24 h); refetch the parent resource for a fresh one.
3. **Uploads are raw bodies**, not `FormData`. Set `Content-Type` to the image type; never `application/json` (it'd be parsed as JSON → 422).
4. **CSV import** body is plain text with `Content-Type: text/csv`.
5. **Refresh token rotates** every refresh. Persist the newest; single-flight refreshes; reusing an old one after 20 s logs the user out everywhere.
6. **404 can mean "not allowed"** (outside scope). Don't show "doesn't exist" too confidently; "Not found or no access" is safer.
7. **Display instants in the company timezone** (`/me.company.timezone` / settings), not the browser's. Build correction instants the same way.
8. **Leave preview fields are top-level**; submit puts them under `data`.
9. **Lists are filtered by role automatically** (attendance, requests, employees). Employees get 403 on `GET /employees` and `/requests/approvals` — don't call them for that role.
10. **`actions` on requests** is the source of truth for buttons; the server re-checks anyway. On `409 REQUEST_STATUS_CONFLICT`, refetch the request.
11. **Status `null`** in attendance = nothing yet / not expected. During the day there's no "Absent" — show "Not checked in yet".
12. **Request types can be disabled per company**; always build the "new request" menu from `GET /requests/types`.
13. **DELETE with a body** — `DELETE /attendance/sessions/{id}` needs `{ "reason" }` as JSON.
14. **Pagination over employees** in attendance grids (one row = one employee with all days).
15. **Repeated query params** for multi-filters (`?status=A&status=B`), and booleans as the strings `true`/`false`.
16. **Emails** (invites/resets) aren't sent yet; in local/staging the links appear in the API log. Demo accounts after `pnpm db:seed`: `admin@`, `manager@`, `employee@demo.stampd.app`, password `demo-password` (`deactivated@` is deactivated; `invited@` is invited).
