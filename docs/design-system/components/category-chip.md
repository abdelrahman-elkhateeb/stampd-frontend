# Category chip

**Purpose.** Show **what kind**: the request type (Leave, WFH, Business trip, Permission, Correction). Also used as a filter toggle in filter bars and on the calendar legend.

**Anatomy.** Pastel pill · 1px ink outline (light) · optional type icon (14–16) · label. Filter variant: + check icon when pressed, + remove × in active-filter rows.

**Colours (pair rule, board 17)**
| Token | Light | Ink ratio | Dark | Cream ratio | Request type |
|---|---|---|---|---|---|
| `--cat-leave` | #FFD3B0 | 13.66 | #4A2E1A | 10.81 | Leave (all leave types) |
| `--cat-wfh` | #EBC7F0 | 12.55 | #3E2547 | 11.76 | WFH |
| `--cat-trip` | #C7D3FA | 12.70 | #2F3A5C | 9.76 | Business trip |
| `--cat-permission` | #DDEFAE | 15.32 | #2F3A14 | 10.57 | Permission / early leave |
| `--cat-correction` | #C2E5F2 | 14.19 | #1C4150 | 9.55 | Attendance correction |

Text is `--cat-foreground` (ink / cream). Border is `--cat-border` (ink / transparent in dark).

**Variants.** `static` (span) · `filter` (button, `aria-pressed`) · `dot` (10px swatch + text, for selects and legends) · `event` (calendar: 20px, 3px ink start bar, see calendar.md).

**Sizes / density.** `h-chip` (28) static · `h-control-xs` (32) filter · text `--fs-body-sm` 600.

**States (filter).** default (`--card` + 1px `--input`, swatch dot) · hover (`--accent` + `--border-strong`) · pressed (category fill + 1.5px `--border-strong` + check icon, 700) · focus-visible (ring) · disabled.

**Behaviour.** Leave types share `--cat-leave` and are told apart by icon + name ("Leave · Annual"). Never introduce a new hue: new request types reuse the closest family + a distinct icon, and must pass the pair rule check.

**Accessibility.** Static chips are text. Filter chips are `<button aria-pressed>`, and the pressed state is shown by a check icon as well as fill.

**RTL.** The start bar and icon sit at inline-start.

**Do / Don't.** ✅ Show the category chip next to the status tag on requests. ❌ Use category colours for status, charts of states, or decoration. ❌ Use mint, coral or yellow (now avatar-only).

**shadcn base + props.** `badge.tsx` / `toggle.tsx`.
```ts
type RequestType = 'leave' | 'wfh' | 'trip' | 'permission' | 'correction';
interface CategoryChipProps { type: RequestType; label?: string; leaveTypeIcon?: LucideIcon; variant?: 'static' | 'filter' | 'dot' | 'event'; pressed?: boolean; onPressedChange?: (v: boolean) => void; onRemove?: () => void; }
```

**Tokens.** `--cat-*`, `--cat-foreground`, `--cat-border`, `--card`, `--input`, `--accent`, `--border-strong`, `--ring`, `--chip-h`, `--control-h-xs`.
