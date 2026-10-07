# stampd-frontend

Web frontend for **Stampd**, the Employee Ops Platform: attendance, leave, requests and approvals for GCC teams, in English and Arabic (full RTL).

**Status:** foundation (FE-01) done: platform, data layer and shared components. No product screens yet. Work is tracked on the Trello board "Employee Ops Platform" (FE-01 … FE-15).

## Layout

| Path | What |
|---|---|
| `docs/design-system/` | The Stampd design system: principles, decisions, component and pattern specs, and the ticket → component map (`backlog-map.md`). Start with its `README.md` |
| `apps/web` | Next.js app (App Router) |
| `apps/web/app/[locale]` | Every route lives under `/en` or `/ar` |
| `apps/web/i18n`, `apps/web/messages` | Locale routing (next-intl) and the English/Arabic message catalogs |
| `apps/web/features/<feature>` | Feature code (auth, attendance, leave, …). Route files in `app/` stay thin |
| `apps/web/api` | `contract.yaml` (temporary stub until BE-00) and the client generated from it (`generated/`, never edit by hand) |
| `apps/web/lib` | App plumbing: API fetchers and errors, session cookies, formatting, forms, env |
| `apps/web/mocks` | The mock API used in development, CI and Playwright |
| `packages/ui` | Shared UI: shadcn/ui (Radix), `src/styles/tokens.css` (source of truth for tokens) and `src/styles/globals.css` (Tailwind v4 entry) |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint and TS settings |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (`radix-nova`, Radix primitives) · lucide-react · next-themes · next-intl · TanStack Query · Zod · Sentry · Vitest + Testing Library · Playwright · Turborepo · pnpm.

Fonts: Plus Jakarta Sans (Latin), IBM Plex Sans Arabic, IBM Plex Mono, loaded with `next/font`.

The stack decisions and their reasons are on the FE-01 card in Trello.

## Getting started

Requires Node ≥ 20.9 and pnpm 11 (`corepack enable`, or `npx pnpm@11.25.0 …`).

```bash
pnpm install
```

```bash
cp apps/web/.env.example apps/web/.env.local
```

```bash
pnpm dev
```

`pnpm dev` starts the **mock API** (port 4000) and Next.js together. Open <http://localhost:3000>: you're sent to `/en` or `/ar` based on your browser language, then to the login page. Log in with `admin@demo.stampd.app`, `manager@demo.stampd.app` or `employee@demo.stampd.app` and the password `demo-password` (the accounts live in `apps/web/mocks/data.ts`).

To run against a real backend, set `API_BASE_URL` to it, set `API_MOCKING=false`, and run `pnpm --filter web dev:next`.

Dev-only pages (on locally and on previews, 404 in production):
- `/en/dev/gallery`: every shared component in its states, with theme, density and language switches. No login needed.
- `/en/dev/api`: an end-to-end check of the data layer (server and browser paths, company-time formatting).

### Scripts (from the repo root)

| Script | What |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint; fails on any warning |
| `pnpm typecheck` | Generates route types, then `tsc` |
| `pnpm test` | Unit and component tests (Vitest) |
| `pnpm test:e2e` | Builds, then runs Playwright against `next start` + the mock API (auth flows, RTL, 360px, axe WCAG AA in both themes) |
| `pnpm --filter web api:generate` | Regenerates the API client, Zod schemas and mocks from `api/contract.yaml` (CI fails if they're out of date) |

Before the first `test:e2e`, install the browser once: `pnpm --filter web exec playwright install chromium`.

### Environment variables

All variables are listed in `apps/web/.env.example` and validated with Zod (`apps/web/lib/env/schema.ts`). `next dev` and `next build` stop with a clear message when one is missing or invalid.

- Server-only variables (no prefix) are never sent to the browser.
- `NEXT_PUBLIC_*` variables are inlined into the browser bundle, so never put secrets there.
- Sentry is off unless `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set.

## Languages and RTL

- Locales: `en` (default) and `ar`. URLs always carry the locale (`/en/…`, `/ar/…`).
- First visit: the `Accept-Language` header decides, with English as the fallback. After that, the `NEXT_LOCALE` cookie remembers the user's choice.
- `<html lang dir>` is set on the server, and Radix components get the direction from `DirectionProvider`.
- Arabic always uses Latin digits and the Gregorian calendar. Format with `getIntlLocale(locale)` from `apps/web/i18n/locale.ts`, never with a bare `"ar"`.
- No hard-coded strings: add each key to both `messages/en.json` and `messages/ar.json`. A unit test fails if the two catalogs differ. Arabic copy needs a native review (`docs/design-system/content.md`).

## Data layer (FE-01b)

- **Sessions (BFF).** The browser never sees tokens. Login and logout are Server Actions that keep the access and refresh tokens in httpOnly cookies. `proxy.ts` refreshes an expired access token silently before the page renders. Browser calls go to `/api/*`, a route handler that adds the token and calls the backend. `/api/auth/*` is blocked there, because only Server Actions may see token responses.
- **Refresh tokens rotate.** Parallel requests share one refresh call (`lib/auth/refresh.ts`), because replaying a rotated token ends the whole session.
- **Generated client.** Orval turns `api/contract.yaml` into TanStack Query hooks (`api/generated/query`), server functions (`api/generated/server`), Zod schemas (`api/generated/zod`) and MSW handlers. Use the query hooks in client components and the server functions in Server Components and Server Actions.
- **Errors.** Every failed call throws `ApiError` (`status`, `code`, `fieldErrors`, `requestId`). Codes are translated (`messages › apiErrors`, `fieldErrors`); the API's `message` is never shown. On the server, 401 sends the user to login and back, and 403 shows the "no access" page. In the browser, a 401 does the same, and failed mutations show a toast unless the form handles them (`meta: { handlesErrors: true }`).
- **Forms.** react-hook-form + the generated Zod schema with `codeErrorMap`, so client and server validate with the same rules (`lib/forms.ts`, `components/form-fields.tsx`).
- **Dates.** Use `lib/format.ts` (or `useFormat()` in client components). Timestamps are shown in the company's timezone, and plain dates (`YYYY-MM-DD`) are never turned into `Date` objects with a timezone. Relative times render on the client only (`<RelativeTime>`).

## Components (FE-01c)

Shared components live in `packages/ui/src/components`, styled to `docs/design-system/components/*.md`. Always import `cn` from `@workspace/ui/lib/utils`: it knows the Stampd theme, so classes like `text-ui` don't silently drop text colours. The app adds translations on top: `components/status.tsx` (status chips), `components/pickers.tsx` (date, range and time fields using the company calendar), `lib/use-table-url-state.ts` (table state in the URL) and `lib/use-table-labels.ts`.

## Error pages

| Case | File |
|---|---|
| Unknown URL / `notFound()` | `app/[locale]/not-found.tsx` (localised, 404) |
| `forbidden()` | `app/[locale]/forbidden.tsx` (403, needs `experimental.authInterrupts`) |
| Render error | `app/[locale]/error.tsx` (Try again + support code, reported to Sentry) |
| Root layout crash | `app/global-error.tsx` |

## CI and deploys

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build and the Playwright smoke tests on every pull request and on `main`.

Preview deploys run on Vercel: connect the repo in Vercel with **Root Directory** `apps/web`, then set the environment variables from `.env.example` for Preview and Production. Vercel then posts a preview link on every pull request.

## Adding shadcn components

From the repo root:

```bash
pnpm dlx shadcn@latest add dialog -c apps/web
```

They land in `packages/ui/src/components` and pick up Stampd tokens automatically. Restyle them to the specs in `docs/design-system/components/`.

## Rules that lint enforces

- **Logical properties only** (`ms-`, `pe-`, `start-`, `border-s`, `text-start`). Physical classes such as `ml-2` or `text-left` fail lint, so layouts flip in RTL.
- **No unused code.** TypeScript `noUnusedLocals` / `noUnusedParameters`.

The rest of the rules (only tokens, never colour alone, one hero per screen, …) are in `docs/design-system/README.md`.

## Known setup notes

- `apps/web/next.config.ts` aliases `next-intl/config` by hand instead of using `next-intl/plugin`. The plugin loads `@swc/core`'s native addon at config time, and that addon refuses to start when the user profile's `AppData` folder grants rights to extra security IDs (seen on Windows with sandboxed tools installed).
