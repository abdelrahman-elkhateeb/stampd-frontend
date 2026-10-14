# Wiring the frontend to stampd-backend

Read 2026-10-10 from `D:\github projects\stampd-backend` (`main`, commit `6d7f601`). The backend README is the reference for endpoints, rules and error codes; each BE ticket on Trello has the exact bodies.

## What the backend has

**Done (BE-01 … BE-11):** auth and sessions, roles and scopes, change history, company settings / holidays / calendar / uploads, departments and employees (with CSV import and offboarding), attendance (check-in/out, daily status, end-of-day close, corrections), leave types and balance ledger, the request & approval engine, leave requests, and WFH / correction / permission / business trip requests.

**Not yet (BE-12 … BE-15):** company calendar feed, dashboard and report summaries, CSV exports, notifications and emails. FE-09's summary, FE-12, FE-13, FE-14 and FE-15 stay on demo data until those land.

**Run it:**

```bash
cd ../stampd-backend
pnpm install
cp .env.example .env
docker compose up -d     # MongoDB replica set on :27017
pnpm db:setup            # indexes, migrations, demo seed
pnpm dev                 # http://localhost:4000
```

Demo accounts: `admin@`, `manager@`, `employee@demo.stampd.app` (and `deactivated@`, `invited@`), password `demo-password`. The manager manages the employee; both are in Operations.

## Step 1: the data layer (FE-01b), before any screen

The frontend's data layer was removed (README › Status), so nothing calls an API today. The backend README's "set `API_BASE_URL` and `API_MOCKING=false`, run `dev:next`" is out of date: none of that exists in this repo now. Rebuild it as FE-01 decided:

- **Next.js as BFF.** The backend returns `{ accessToken, refreshToken, expiresIn: 900 }` as JSON (Bearer tokens). Keep both in httpOnly cookies set by the Next server; the browser never sees them. Server code calls the API with `Authorization: Bearer …`. No CORS needed, since the browser never calls :4000.
- **Refresh.** Access tokens live 15 min; refresh tokens 30 days and rotate on every `POST /auth/refresh`. The backend allows a 20 s grace window, so parallel refreshes from several server renders are safe. Reuse after that revokes the session → send the user to login with `returnTo`.
- **Errors.** Every error is `{ code, message, fieldErrors? }`. Field codes: `REQUIRED`, `TOO_SHORT`, `TOO_LONG`, `OUT_OF_RANGE`, `INVALID_FORMAT`, plus named ones (e.g. `ALREADY_EXISTS`). Add `OUT_OF_RANGE` and the named codes to `messages › fieldErrors`. 401 → login, 403 → no-access, 404 → not found (the backend answers 404, not 403, for records outside your scope).
- **Pass `X-Request-Id`** through and show it as the support code on error pages.
- **Env:** add the API base URL (server-only, not `NEXT_PUBLIC_`) to `.env.example`.
- **Replace the demo user.** `GET /me` → `{ id, name, email, role, status, locale, employee, company: { id, name, timezone, weekStart, workingDays } }`. Then `proxy.ts` and `canAccess` read the role from the session instead of `DEMO_USER`.

## Shape differences to map

| Thing | Frontend today | Backend |
|---|---|---|
| Roles | `employee` / `manager` / `admin` | `EMPLOYEE` / `MANAGER` / `ADMIN` |
| Weekdays | numbers `0`–`6` (Sun = 0) | codes `"SUN"` … `"SAT"` |
| Request status | `pending`, `cancel-requested`, … | `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`, `CANCELLATION_REQUESTED`, `CANCELLED` |
| Request type keys | `wfh`, `correction`, `permission`, `trip`, `leave` | `WFH`, `ATTENDANCE_CORRECTION`, `PERMISSION`, `BUSINESS_TRIP`, `LEAVE` |
| Holidays | one `date` | `startDate` … `endDate` |
| Lists | arrays | `{ items, meta }`; `page`, `pageSize` (≤ 100), `sort=-field` |
| Dates / instants / times | `YYYY-MM-DD`, ISO, `HH:mm` | the same |
| Ids | strings | UUID v4 strings |

Map these once in the API layer so the components keep their current types.

## Per ticket: what to call

| FE | Endpoints | Notes |
|---|---|---|
| FE-02 auth | `POST /auth/signup`, `/login`, `/refresh`, `/logout`, `/invitations/verify`, `/invitations/accept`, `/password/forgot`, `/password/reset/verify`, `/password/reset` | Replaces `features/auth/demo-auth.ts`. 429 `TOO_MANY_ATTEMPTS` has `Retry-After`; `403 ACCOUNT_DEACTIVATED`. Invite links are `{WEB_APP_URL}/{locale}/invite/{token}` and are logged by the backend until BE-15 sends email |
| FE-03 shell & guards | `GET /me`, `POST /me/password` | Role and company from `/me` |
| FE-04 settings | `GET/PATCH /company/settings` (incl. `disabledRequestTypes`), `PUT/DELETE /company/logo` (raw image body, not multipart), `/company/holidays`, `/leave/types`, `GET /history/company-settings/{companyId}` | Adding a holiday returns `affectedRequests`. Leave type in use → `409 LEAVE_TYPE_IN_USE` |
| FE-05 employees | `/departments`, `/employees` (search, filters, pages), `POST /employees/import` (CSV body), `…/invitation`, `…/deactivation/preview`, `…/deactivation`, `…/reactivation`, `/leave/employees/{id}/balances[/…/entries, /adjustments, /entitlement]`, `GET /history/employees/{id}` | Manager errors are `422` on `managerId` (`MANAGER_LOOP`, …); `409 HAS_DIRECT_REPORTS`, `LAST_ADMIN`, `DEPARTMENT_NOT_EMPTY` |
| FE-06 attendance | `POST /attendance/check-in`, `/check-out`, `GET /attendance/today`, `/attendance/month?month=`, `/attendance/employees/{id}/days/{date}` | Check whether `/today` gives a server time for the live counter (the demo has `SERVER_TIME_OFFSET_MS`) |
| FE-07 leave (not built yet) | `GET /leave/types`, balances, `POST /leave/requests/preview`, `POST /requests` with `type: "LEAVE"`, `GET /leave/employees/{id}/requests` | Build it against the API directly; the preview returns days, excluded days, balance before/after, problems and who else is off |
| FE-08 requests | `GET /requests/types`, `GET /requests/mine` (`type`, `status`, `from`, `to`, pages), `POST /requests`, `GET /requests/{id}`, `POST /requests/{id}/withdraw`, `/cancellation`, `/cancel` | See below |
| FE-10 approvals | `GET /requests/approvals`, `POST /requests/{id}/approve`, `/reject`, `/cancellation/approve`, `/cancellation/decline` | `409 REQUEST_STATUS_CONFLICT` when someone decided first; `403 SELF_APPROVAL` |
| FE-11 HR attendance | `GET /attendance/days?date=`, `/attendance/month`, `/attendance/exceptions`, session add/edit/delete with `reason`, `GET /history/attendance-days/{id}` | |

## FE-08 specifically (built on demo data, needs reshaping)

- **Type metadata is not the design-system shape.** `GET /requests/types` gives `{ key, label, enabled, approverPolicy, dates: SINGLE_DAY|RANGE, times: NONE|OPTIONAL|REQUIRED, reason, colleagueVisibility, fields: [{ name, kind: text|time|choice|leaveType, required, maxLength?, options? }] }`. Labels are English only; translate by key in `messages`. So the generic form renders: the date (or range) from `dates`, the time window from `times`, `reason`, then `fields` by `kind`. Rewrite `buildSchema` / `RequestField` for this shape and keep the fail-closed rule for unknown kinds.
- **Submit body:** `{ type, employeeId?, startDate, endDate?, startTime?, endTime?, reason, data, approved? }`. Type fields go in `data` (correction: `checkInTime` / `checkOutTime`, both optional; trip: `destination`, `purpose`). Errors on those come back as `data.<field>`.
- **Detail** carries `actions` (`WITHDRAW`, `REQUEST_CANCELLATION`, `CANCEL`, `APPROVE`, …) and `timeline` (`{ status, previousStatus, actor, source, reason, at }`). Drop `allowedActions()` and `canView()` and use these. A request you can't see is a 404, not 403.
- **Overlaps are the server's job:** `409 REQUEST_OVERLAP` (leave vs WFH or trips in both directions, and WFH vs WFH). Drop `findLeaveConflict()` and show that error under the dates. Also `409 REQUEST_TYPE_DISABLED`.
- **Correction limits:** one past day, at most 30 days back.

## Suggested order

1. FE-01b data layer + FE-02 auth + FE-03 `/me` (everything else needs a session).
2. FE-08 (freshest code, the request engine is complete) and FE-06 attendance.
3. FE-04 settings and FE-05 employees.
4. FE-07 leave and FE-10 approvals, built straight against the API.
