@AGENTS.md

# Building a screen (FE-02 … FE-15)

The data layer (FE-01b) talks to stampd-backend; screens move off demo data as each one is wired (`docs/backend-integration.md` says what to call).

- **Spec first, nothing else:** the ticket's row in `docs/design-system/backlog-map.md`, then only the `docs/design-system/components/*.md` and `patterns/*.md` it names. Never read the PDF or `reference/*.html`.
- **Where things go:** route files in `apps/web/app/[locale]/(app)/…` stay thin and render a component from `apps/web/features/<area>/`. Shared UI in `packages/ui/src/components` (check there first; add a component only when a screen needs it). **shadcn first** (README › Adding shadcn components): if shadcn has it, add it with the CLI instead of writing it by hand. App plumbing in `apps/web/lib`.
- **Shell:** `apps/web/components/app-shell.tsx` (sidebar, top bar, bottom nav, nav items). Each page owns its `h1` in a page header.
- **Data:** the signed-in user is `getMe()` on the server and `useUser()` in client components; other calls go through `api()` in `apps/web/lib/api.ts` (server only). Screens not wired yet still use `features/<area>/demo-data.ts` and `lib/demo-user.ts`, marked `ponytail:` for the swap.
- **Copy:** every string in both `apps/web/messages/en.json` and `ar.json`. Keys are typed from `en.json`.
- **Done =** `pnpm typecheck && pnpm lint && pnpm test` in `apps/web`, plus one screenshot pass at 360 and 1280, light and dark, en and ar.
