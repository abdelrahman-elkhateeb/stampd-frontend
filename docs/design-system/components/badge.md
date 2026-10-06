# Badge (count & label badge)

**Purpose.** Small counts and markers: nav counts ("Approvals 7"), tab counts, the bell unread count, "New", neutral tags ("Draft", "Corrected").

**Variants**
| variant | Style | Use |
|---|---|---|
| `count` | `--inverse` / `--inverse-foreground`, min 20×20, pill, 11–12px 700 tabular | Nav and tab counts |
| `count-attention` | `--status-pending-bg` / `--status-pending` | Counts that need action (Corrections 5, Exceptions) |
| `alert` | `--status-absent` / `--card`, 2px ring in the surrounding background | Bell unread count only |
| `new` | `--brand` / `--brand-foreground` + 1px `--border-strong` | Max one per list |
| `neutral` | `--muted` / `--subtle-foreground`, radius sm | "Draft", meta tags |

**Sizes.** Height 20 (18 on the bell), padding-inline `--space-1-5`. Caps at "99+" (nav) and "9+" (bell).

**States.** Static. When a count changes, use the badge's live-region rules (bell only).

**Accessibility.** Counts are included in the parent's accessible name ("Approvals, 7 pending"). The badge itself is `aria-hidden` to avoid double reading.

**RTL.** Positioned with `inset-inline-end`.

**Do / Don't.** ❌ Badges for status (use Status chip). ❌ Showing a "0" badge (hide it instead).

**shadcn base + props.** `badge.tsx`.
```ts
interface CountBadgeProps { count: number; max?: 9 | 99; variant?: 'count' | 'count-attention' | 'alert'; }
interface LabelBadgeProps { children: string; variant?: 'new' | 'neutral'; }
```

**Tokens.** `--inverse*`, `--status-pending*`, `--status-absent`, `--brand*`, `--muted`, `--subtle-foreground`, `--radius-pill`, `--radius-sm`.
