# Features

One folder per product area: `auth`, `attendance`, `leave`, `requests`, `approvals`, `calendar`, `people`, `settings`, `reports`, `notifications`.

Each feature keeps its own components, hooks, schemas and tests. Route files in `app/[locale]/…` stay thin: they read params and render a feature component.

Shared UI lives in `packages/ui`. Shared app plumbing (formatting, forms, demo data) lives in `apps/web/lib`.
