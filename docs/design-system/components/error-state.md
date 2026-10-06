# Error state

**Purpose.** Tell the user what failed, what still works and what to do. It's scoped to the failing section, never a blank page.

**Anatomy.** 48px circle (`--error-bg` / `--error`, `TriangleAlert`) · title (what failed) · body (what still works + next step) · actions: "Try again" (primary) · support code chip (`--font-code`, `--muted`, copyable).

**Variants.** `section` (inside a card or table) · `inline` (one-line alert bar: `--error-bg` / `--error`, icon, text, link action) · `page` (403 / 404 / crash boundary at hero size: title `--fs-h1`, actions Back + Go to dashboard) · `offline` (top banner, `--warning-bg` / `--warning`, auto-retry).

**Sizes.** Section padding `--space-8` / `--space-6`. Page: centred, max 480.

**Behaviour.** Retry re-runs the failed query only. After 3 failures, add "Contact support" with the code. 401 → redirect to login with a return URL (FE-01). 403 → page variant "You don't have access" (FE-01, FE-03). The crash boundary offers "Reload page".

**Accessibility.** Section and inline errors use `role="alert"` (announced once). Page errors move focus to the `h1`. The code chip has a copy button "Copy support code".

**RTL.** Mirrors; the code chip is `dir="ltr"`.

**Do / Don't.** ✅ "Couldn't load team attendance. The rest of the page still works." ❌ Raw API messages. ❌ Doodles.

**shadcn base + props.** `alert.tsx` + custom.
```ts
interface ErrorStateProps { variant: 'section' | 'inline' | 'page' | 'offline'; title: string; body?: string; code?: string; onRetry?: () => void; actions?: React.ReactNode; status?: 401 | 403 | 404 | 500; }
```

**Tokens.** `--error`, `--error-bg`, `--warning`, `--warning-bg`, `--muted`, `--font-code`, `--primary*`.
