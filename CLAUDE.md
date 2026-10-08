@AGENTS.md

# Building a screen (FE-02 … FE-15)

UI-only until the backend exists: screens run on demo data.

- **Spec first, nothing else:** the ticket's row in `docs/design-system/backlog-map.md`, then only the `docs/design-system/components/*.md` and `patterns/*.md` it names. Never read the PDF or `reference/*.html`.
- **Where things go:** route files in `apps/web/app/[locale]/(app)/…` stay thin and render a component from `apps/web/features/<area>/`. Shared UI in `packages/ui/src/components` (check there first; add a component only when a screen needs it). App plumbing in `apps/web/lib`.
- **Shell:** `apps/web/components/app-shell.tsx` (sidebar, top bar, bottom nav, nav items). Each page owns its `h1` in a page header.
- **Demo data:** the user in `apps/web/lib/demo-user.ts`; per-feature fixtures in `features/<area>/demo-data.ts`. Mark them `ponytail:` for the backend swap.
- **Copy:** every string in both `apps/web/messages/en.json` and `ar.json`. Keys are typed from `en.json`.
- **Done =** `pnpm typecheck && pnpm lint && pnpm test` in `apps/web`, plus one screenshot pass at 360 and 1280, light and dark, en and ar.
