# Features

One folder per product area: `auth`, `onboarding`, `dashboard`, `attendance`, `attendance-review`, `leave`, `requests`, `approvals`, `team`, `calendar`, `employees`, `profile`, `settings`, `reports`.

Each feature keeps its own components and rules, plus, where it has them, its server reads (`<area>-data.ts`) and server actions (`actions.ts`). Route files in `app/[locale]/…` stay thin: they read params and render a feature component. Tests live in `apps/web/tests/`, mirroring these paths.

Shared UI lives in `packages/ui`. Shared app plumbing (API client, session, formatting, forms) lives in `apps/web/lib`.
