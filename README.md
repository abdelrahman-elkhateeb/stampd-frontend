# stampd-frontend

Web frontend for **Stampd**, the Employee Ops Platform: attendance, leave, requests and approvals for GCC teams, in English and Arabic (full RTL).

**Status:** planning. The design system is documented and wired into the app shell; no product screens yet. Work is tracked on the Trello board "Employee Ops Platform" (FE-01 … FE-15).

## Layout

| Path | What |
|---|---|
| `docs/design-system/` | The Stampd design system: principles, decisions, component and pattern specs, and the ticket → component map (`backlog-map.md`). Start with its `README.md` |
| `apps/web` | Next.js app (App Router) |
| `packages/ui` | Shared UI: shadcn/ui (Radix), `src/styles/tokens.css` (source of truth for tokens) and `src/styles/globals.css` (Tailwind v4 entry) |
| `packages/eslint-config`, `packages/typescript-config` | Shared lint and TS settings |

## Stack

Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui (`radix-nova`, Radix primitives) · lucide-react · next-themes · Turborepo · pnpm.

Fonts: Plus Jakarta Sans (Latin), IBM Plex Sans Arabic, IBM Plex Mono, loaded with `next/font`.

## Getting started

Requires Node ≥ 20.9 and pnpm 11 (`corepack enable`, or `npx pnpm@11.25.0 …`).

```bash
pnpm install
pnpm dev
```

Other scripts (from the repo root): `pnpm build`, `pnpm lint` (fails on any warning), `pnpm typecheck`.

Add shadcn components from the repo root:

```bash
pnpm dlx shadcn@latest add dialog -c apps/web
```

They land in `packages/ui/src/components` and pick up Stampd tokens automatically. Restyle them to the specs in `docs/design-system/components/`.

## Rules that lint enforces

- **Logical properties only** (`ms-`, `pe-`, `start-`, `border-s`, `text-start`). Physical classes such as `ml-2` or `text-left` fail lint, so layouts flip in RTL.
- **No unused code.** TypeScript `noUnusedLocals` / `noUnusedParameters`.

The rest of the rules (only tokens, never colour alone, one hero per screen, …) are in `docs/design-system/README.md`.
