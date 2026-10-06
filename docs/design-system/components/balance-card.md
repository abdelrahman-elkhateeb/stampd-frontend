# Balance card (composite) · v0.4

**Purpose.** Explain a leave balance at a glance (FE-07), with a compact tile for the dashboard (FE-09).

**Anatomy.** Header: leave-type icon tile (`--cat-leave` + ink outline) + type name + "Details" link (→ ledger) · available number (`--fs-numeric` 800) + "days available of {entitlement}" · segmented progress bar · legend (2×2): Used · Upcoming (approved) · Pending (reserved) · Available, each with a pattern swatch + tabular number · footer: leave-year range + reset date.

**Variants.** `full` (FE-07 My Leave) · `tile` (FE-09: name, available, "of N", pending count) · `untracked` ("Not tracked" + days used this year; no bar, per FE-07).

**Segment order & patterns (fixed, from inline-start).** Used = solid `--foreground` · Upcoming = 45° hatch of `--foreground` on `--cat-leave` · Pending = vertical stripes `--status-pending` on `--status-pending-bg` · Available = `--cat-leave`. The track outline is 1px `--border-strong`.

**Rules.**
- `used + upcoming + pending + available = entitlement + adjustments`. The numbers come from the API and are never computed client-side. The ledger proves them (FE-07 AC).
- Pending is shown clearly, so the employee understands why "available" dropped (FE-07 note).
- Negative balance (allowed types): available shows "−2" in `--error` with the text "2 days over"; the bar shows no available segment.
- Half days show one decimal ("2.5").

**States.** default · loading (skeleton, same size) · error (inline error in the card).

**Accessibility.** The bar is `role="img"` with an `aria-label` sentence: "21 days: 6 used, 2 upcoming, 3 pending, 10 available". The legend is a `<dl>`.

**RTL.** The segment order runs from the right. Patterns are not mirrored.

**Props.**
```ts
interface BalanceCardProps { leaveType: { name: string; icon: LucideIcon; tracked: boolean }; entitlement: number; used: number; upcoming: number; pending: number; available: number; usedThisYear?: number; leaveYear: { start: string; end: string }; detailsHref: string; variant?: 'full' | 'tile'; loading?: boolean; }
```

**Tokens.** `--cat-leave`, `--foreground`, `--status-pending*`, `--border-strong`, `--error`, `--muted-foreground`, `--fs-numeric`.
