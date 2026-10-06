# Stat tile

**Purpose.** One number with context: HR today tiles (FE-13: Present, Late, Absent, WFH, On Leave, Business Trip, Not yet checked in), manager team counts (FE-10), leave balance tiles (FE-09).

**Anatomy.** Label row (8px status dot or category swatch + label `--fs-body-sm` 600) · value (`--fs-h1`/`--fs-numeric` 800, tabular, optional "/ total" in `--fs-h4` muted) · optional delta chip (arrow icon + words) · optional link affordance.

**Variants.** `default` (card level 1) · `link` (whole tile is a link to the filtered view, per FE-13) · `hero` (`--brand` fill, 1.5px `--border-strong`, `--elev-hard`; only the single most actionable tile, e.g. "Pending approvals 7") · `loading` (skeleton with the same dimensions).

**Sizes / density.** Padding `p-card`. Value `--fs-h1` in compact, `--fs-numeric` on the employee balance tiles. Grid: 4 per row at `xl`, 2 at `md`, 1 on mobile (7 FE-13 tiles wrap 4 + 3).

**Delta chip.** `h-chip-sm`, `ArrowUp`/`ArrowDown` + words ("3% vs last Tue", "4 more than avg"). Good/bad colour is defined **per metric** (Present up = success; Late up = error). Never rely on arrow direction or colour alone; the words carry the meaning.

**States.** Link tiles: hover = card interactive style, focus ring. A zero value shows "0" (not an empty state) except for a brand-new company (FE-13), where tiles show "—" and the setup checklist leads.

**Behaviour.** Today tiles sum to active tracked employees (FE-13 AC). Before the end-of-day close, "Not yet checked in" is used instead of Absent.

**Accessibility.** Link tile name: "Late today, 11, 4 more than average". The value uses `<data value="11">`.

**RTL.** The dot/label row and arrows mirror. Numbers are formatted with Intl.

**Do / Don't.** ✅ Link to the filtered list. ❌ Sparklines on the employee dashboard (FE-09: no charts). ❌ Per-person rankings.

**shadcn base + props.** `card.tsx`.
```ts
interface StatTileProps { label: string; value: number | null; total?: number; marker?: { kind: 'status'; status: AttendanceStatus } | { kind: 'category'; type: RequestType }; delta?: { text: string; direction: 'up' | 'down' | 'flat'; tone: 'success' | 'error' | 'neutral' }; href?: string; variant?: 'default' | 'hero'; loading?: boolean; }
```

**Tokens.** `--card`, `--border`, `--brand*`, `--border-strong`, `--elev-hard`, `--status-*`, `--success*`, `--error*`, `--muted-foreground`, `--fs-h1`, `--fs-numeric`, `--fw-black`.
