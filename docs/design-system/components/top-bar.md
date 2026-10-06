# Top bar

**Purpose.** Page context and global actions (FE-03): company name/logo, page title, search, language, theme, notifications, user menu.

**Anatomy.**
- Desktop (64): breadcrumb (`--fs-caption` muted) + page title (`--fs-h4` 700) at start · global search trigger (240, `Ctrl K` hint) · language toggle (EN / عربي segmented, 2 options) · theme toggle (icon button `Moon`/`Sun`) · notification bell · avatar (user menu).
- Mobile (64): start = greeting + date (dashboard) or back arrow + title (inner pages) · end = bell (44) · the user menu lives under "Me".

**Variants.** `desktop` · `mobile-home` · `mobile-inner` (back + title, sticky).

**States.** Sticky with a hairline when scrolled (`border-b --border`); flat on mobile home. The language toggle uses Segmented control states. The `عربي` option carries `lang="ar"`.

**Behaviour.** The language change sets `<html lang dir>` and persists to the user profile. The theme follows the system by default, then the user's choice (stored per device). Search opens a command palette (people, requests, pages) scoped by role.

**Accessibility.** `<header>`. Search is `role="search"` with a visible label in the palette. The back button is labelled "Back to {parent}". The avatar menu button is labelled "Account menu".

**RTL.** The order mirrors and the back arrow flips.

**Do / Don't.** ❌ Butter in the top bar. ❌ More than one primary action here (page actions belong in the page header).

**shadcn base + props.** Custom + `command.tsx`, `dropdown-menu.tsx`.
```ts
interface TopBarProps { variant: 'desktop' | 'mobile-home' | 'mobile-inner'; title: string; breadcrumb?: { label: string; href: string }[]; backHref?: string; greeting?: string; }
```

**Tokens.** `--background`, `--card`, `--border`, `--muted`, `--inverse*` (active language), `--muted-foreground`, `--control-h-sm`.
