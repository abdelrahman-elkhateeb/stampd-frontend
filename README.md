# stampd-frontend

Web frontend for **Stampd**, the Employee Ops Platform: attendance, leave, requests and approvals for GCC teams, in English and Arabic (full RTL).

**Status:** Platform, shared components and the data layer (FE-01a, FE-01c, FE-01b) are in: login and sessions run against [stampd-backend](../stampd-backend), and the shell shows the signed-in user. Most screens still run on demo data (`features/<area>/demo-data.ts`) until they are wired to the API; `docs/backend-integration.md` lists what each one calls. Work is tracked on the Trello board "Employee Ops Platform" (FE-01 … FE-15).

## Layout

| Path | What |
|---|---|
| `docs/design-system/` | The Stampd design system: principles, decisions, component and pattern specs, and the ticket → component map (`backlog-map.md`). Start with its `README.md` |
| `apps/web` | Next.js app (App Router) |
| `apps/web/app/[locale]` | Every route lives under `/en` or `/ar` |
| `apps/web/i18n`, `apps/web/messages` | Locale routing (next-intl) and the English/Arabic message catalogs |
| `apps/web/features/<feature>` | Feature code (auth, attendance, leave, …). Route files in `app/` stay thin |
| `apps/web/lib` | App plumbing: API client and session, formatting, forms, table URL state, demo data |
| `packages/ui` | Shared UI: shadcn/ui (Radix), `src/styles/tokens.css` (source of truth for tokens) and `src/styles/globals.css` (Tailwind v4 entry) |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint and TS settings |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (`radix-nova`, Radix primitives) · lucide-react · next-themes · next-intl · nuqs · react-hook-form + Zod · Vitest + Testing Library · Playwright · Turborepo · pnpm.

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

The app needs stampd-backend running on `API_BASE_URL` (see its README: `pnpm db:setup && pnpm dev`). Open <http://localhost:3000>: you're sent to `/en` or `/ar` based on your browser language, then to login. Seeded accounts: `admin@`, `manager@`, `employee@demo.stampd.app`, password `demo-password`.

Dev-only pages (on locally and on previews, 404 in production):
- `/en/dev/gallery`: every shared component in its states, with theme, density and language switches. No login needed.

### Scripts (from the repo root)

| Script | What |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint; fails on any warning |
| `pnpm typecheck` | Generates route types, then `tsc` |
| `pnpm test` | Unit and component tests (Vitest) |
| `pnpm test:e2e` | Builds, then runs Playwright against `next start` (locale routing, sign-in redirect and login form, RTL, 360px, axe WCAG AA in both themes). No backend needed, so it doesn't log in |

Before the first `test:e2e`, install the browser once: `pnpm --filter web exec playwright install chromium`.

### Environment variables

See `apps/web/.env.example`. `NEXT_PUBLIC_APP_ENV`: `production` hides `/dev/*`. `API_BASE_URL`: stampd-backend, called only from the Next server. `NEXT_PUBLIC_*` variables are inlined into the browser bundle, so never put secrets there.

## Languages and RTL

- Locales: `en` (default) and `ar`. URLs always carry the locale (`/en/…`, `/ar/…`).
- First visit: the `Accept-Language` header decides, with English as the fallback. After that, the `NEXT_LOCALE` cookie remembers the user's choice.
- `<html lang dir>` is set on the server, and Radix components get the direction from `DirectionProvider`.
- Arabic always uses Latin digits and the Gregorian calendar. Format with `getIntlLocale(locale)` from `apps/web/i18n/locale.ts`, never with a bare `"ar"`.
- No hard-coded strings: add each key to both `messages/en.json` and `messages/ar.json`. A unit test fails if the two catalogs differ. Arabic copy needs a native review (`docs/design-system/content.md`).

## Forms and dates

- **Forms.** react-hook-form + a Zod schema with `codeErrorMap`, so errors are codes translated under the field (`lib/forms.ts`, `components/form-fields.tsx`).
- **Dates.** Use `lib/format.ts` (or `useFormat()` in client components). Plain dates (`YYYY-MM-DD`) are formatted in UTC and never shift a day.

## Components (FE-01c)

Shared components live in `packages/ui/src/components`, styled to `docs/design-system/components/*.md`. Always import `cn` from `@workspace/ui/lib/utils`: it knows the Stampd theme, so classes like `text-ui` don't silently drop text colours. The app adds translations on top: `components/status.tsx` (status chips), `components/pickers.tsx` (date, range and time fields using the company calendar), `lib/use-table-url-state.ts` (table state in the URL) and `lib/use-table-labels.ts`.

## Sessions and API calls (FE-01b)

- **Next.js is the BFF.** The browser never talks to the API. Auth server actions (`features/auth/actions.ts`) keep the tokens in httpOnly cookies (`lib/session.ts`); server code calls the API with `api()` (`lib/api.ts`), which adds the Bearer token.
- **`proxy.ts`** refreshes an access token with under 60 s left (new cookies apply to the same render), sends signed-out visitors to `/login?returnTo=…`, sends signed-in users away from login/signup, and shows the no-access page for routes the role can't open (`lib/access.ts`; it asks `GET /me` only on those routes, since the token carries no role).
- **The user.** `getMe()` (server, once per request) and `useUser()` (client, from `(app)/layout.tsx`). API shapes are mapped in `lib/user.ts` (`ADMIN` → `admin`, `"SUN"` → `0`).
- **Errors.** In `api()`, a 401 goes to login. On GETs, a 404 shows the not-found page and a 403 the no-access page. Anything else throws `ApiError` (`code`, `fieldErrors`, and the request id as the support code).

## Error pages

| Case | File |
|---|---|
| Unknown URL / `notFound()` | `app/[locale]/not-found.tsx` (localised, 404) |
| Render error | `app/[locale]/error.tsx` (Try again + support code) |
| Root layout crash | `app/global-error.tsx` |

## CI and deploys

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build and the Playwright smoke tests on every pull request and on `main`.

Preview deploys run on Vercel: connect the repo in Vercel with **Root Directory** `apps/web`, then set `NEXT_PUBLIC_APP_ENV` for Preview and Production. Vercel then posts a preview link on every pull request.

## Adding shadcn components

**Rule: shadcn first.** Before building anything for a new feature (a component, a sub-part such as menu radio items, or a behaviour such as theming), check whether shadcn already has it ([components](https://ui.shadcn.com/docs/components), [dark mode](https://ui.shadcn.com/docs/dark-mode/next)) and what is already in `packages/ui/src/components`. If shadcn has it, add it with the CLI and restyle it; write it by hand only when shadcn has nothing for it, and say why in the PR.

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
