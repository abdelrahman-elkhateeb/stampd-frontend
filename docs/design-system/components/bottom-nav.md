# Bottom nav

**Purpose.** Primary navigation on mobile (below `md`).

**Anatomy.** Bar (72px + safe-area inset) · 4 items: icon in a 56×30 pill + label below (`--fs-caption`).

**Items by role.** Employee: Home · Requests · Calendar · Me. Manager/Admin: Home · Requests · Approvals (count) · Me. Calendar and company sections move into the "Me" menu.

**Item states.** default (`--subtle-foreground`, 500) · active (pill `--brand` + 1.5px inset `--border-strong`, label `--foreground` 700, `aria-current="page"`) · focus-visible (ring) · count badge (`alert`, on the icon pill).

**Behaviour.** Hidden on form pages and full-screen flows (FE-07/FE-08 mobile forms). Never covers content: the page gets `padding-bottom` equal to the bar height. Check-in lives on Home, not in the nav.

**Accessibility.** `<nav aria-label="Main">`. Labels are always visible (no icon-only). Item names include counts.

**RTL.** The order mirrors (Home on the right).

**Do / Don't.** ❌ More than 4 items. ❌ A centre floating action button.

**shadcn base + props.** Custom.
```ts
interface BottomNavProps { items: { id: string; label: string; href: string; icon: LucideIcon; count?: number }[]; activeId: string; }
```

**Tokens.** `--card`, `--border`, `--brand`, `--border-strong`, `--foreground`, `--subtle-foreground`, `--status-absent` (badge).
