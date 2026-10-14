# Wiring the frontend to stampd-backend

Checked 2026-10-15 against `D:\githubProj\stampd-backend` (`main`, commit `a426f22`). The backend README is the reference for endpoints, rules and error codes; each BE ticket on Trello has the exact bodies.

## Status

Every screen reads and writes the API. Nothing runs on demo data any more, except the dev gallery (`/dev/gallery`, which renders with `lib/demo-user.ts` outside the app shell).

**Not built: FE-15 notifications.** BE-15 (notifications and emails) doesn't exist yet. The bell shows no count, and invite and reset links are only logged by the backend.

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

## How the data layer works

README › Sessions and API calls describes it. In short: Next.js is the BFF (tokens in httpOnly cookies), `api()` in `lib/api.ts` adds the Bearer token, `proxy.ts` refreshes tokens and guards routes, and `getMe()` / `useUser()` give the signed-in user.

Per feature, the same three files:

- `features/<area>/<area>-data.ts`: server reads. Each maps the API's shape to the app's once (statuses to the chip's kebab form, weekday codes to numbers, nulls to `""`), so components keep their types.
- `features/<area>/actions.ts`: server actions. They return a `Problem` (or `undefined`) and call `refresh()` so the page re-renders with the server's answer.
- The page reads its filters, month, tab or open item from the URL (`searchParams`); client components change them with nuqs `shallow: false`.

## Per ticket: what it calls

| FE | Screen | Endpoints |
|---|---|---|
| FE-02 auth | login, signup, invite, reset | `/auth/*` (`features/auth/actions.ts`) |
| FE-03 shell & profile | shell, `/me` | `GET /me`, `GET/PATCH /employees/{id}`, `POST /me/password`, `PUT/DELETE /employees/{id}/photo`; the approvals badge counts `GET /requests/approvals` |
| FE-04 settings | `/settings/*` | `GET/PATCH /company/settings` (only changed fields; `disabledRequestTypes` for the request-type switches), `PUT/DELETE /company/logo`, `GET /history/company-settings/{companyId}`, `/company/holidays` (by year), `/leave/types` |
| FE-05 employees | `/employees/*` | `GET /employees` (search, department, status, sort, pages from the URL), `POST/PATCH /employees`, invitation, deactivation preview + deactivation, reactivation, `/departments`, `POST /employees/import` (CSV body), balances, ledger entries, adjustments, `GET /history/employees/{id}` |
| FE-06 attendance | `/attendance` | `GET /attendance/today`, `/attendance/month`, day detail + `GET /history/attendance-days/{recordId}`, check-in / check-out |
| FE-07 leave | `/leave`, `/leave/new` | balances, `GET /leave/employees/{id}/requests`, `POST /leave/requests/preview` (300 ms after each change), `POST /requests` with `type: "LEAVE"` |
| FE-08 requests | `/requests/*` | `GET /requests/types`, `/requests/mine`, `/requests/{id}`, `POST /requests`, withdraw / cancellation / cancel |
| FE-09 / FE-13 dashboard | `/` | `GET /dashboard/employee` (upcoming), `/dashboard/manager`, `/dashboard/admin`, plus today, balances and my pending requests |
| FE-10 approvals & team | `/approvals`, `/team` | `GET /requests/approvals`, approve / reject / cancellation approve / decline; `/attendance/month` for the team |
| FE-11 HR attendance | `/attendance-review` | `/attendance/days`, `/attendance/month`, `/attendance/exceptions`, session add / edit / delete with `reason` |
| FE-12 calendar | `/calendar` | `GET /calendar/events` (`includePending`, `team`), `GET /calendar/availability` |
| FE-14 reports | `/reports` | the six `/reports/*` views; `format=csv` through `/[locale]/reports/export` (the token stays on the server) |

## Simplifications to know

Each is marked `ponytail:` in the code where it lives.

- Lists read the first 100 rows where the screen has no pager yet (my requests, leave history, approvals, ledgers, history lists, attendance grids).
- Approve commits at once: no Undo window, no comment box, no bulk approve.
- The review panel shows no balance after approval or teammates out (a manager can't preview someone else's leave).
- The correction editor saves one session at a time; there is no live status preview (the API has no dry run).

## Backend gaps found

- `GET /requests/approvals` without a `status` filter lists decided requests too: `listApprovals` spreads `filters.statuses` (undefined) over its `PENDING, CANCELLATION_REQUESTED` default. The app always passes `status`.
- The attendance-correction refine sends `INVALID_FORMAT` for "no times given"; it should be `REQUIRED` (via `params.code`).
