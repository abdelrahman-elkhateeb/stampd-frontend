# Button

**Purpose.** Triggers an action. The brand variant is the hero action (check-in, first-use CTA), at most once per screen.

**Anatomy.** Pill container · optional leading icon (`size-icon`) · label · optional trailing icon (directional → `flip-rtl`) · loading spinner (replaces the leading icon).

**Variants**
| variant | Fill / text | Border | Shadow | Use |
|---|---|---|---|---|
| `brand` | `--brand` / `--brand-foreground` (13.87:1) | 1.5px `--border-strong` | `--elev-hard` | Check in/out, first-use CTA. Max 1 per screen |
| `default` (primary) | `--primary` / `--primary-foreground` (18.59 · 16.50) | none | none | Main action: Approve, Submit request, Save |
| `secondary` | `--secondary` / `--secondary-foreground` | none | none | Export CSV, low-emphasis actions |
| `outline` | `--card` / `--foreground` | 1px `--input` (3.28:1) | none | Cancel, Reject (with `text-destructive`) |
| `ghost` | transparent / `--foreground` | none | none | Tertiary: "View all", toolbar actions |
| `destructive` | `--destructive` / `--destructive-foreground` (6.47 · 8.11) | none | none | The confirming action in a destructive dialog only |
| `link` | transparent, underline 1.5px, offset 4px | — | — | Inline navigation in text |

**Sizes / density**
| size | Height | Padding-inline | Text | Use |
|---|---|---|---|---|
| `hero` | 56px | `--space-6` (28 in the design) | `--fs-body-lg` 700 | Check-in only, full width on mobile |
| `default` | `h-control` (48 comfortable / 36 compact) | `--space-6` / `--space-4` | `--fs-ui` 600 | Default |
| `sm` | `h-control-sm` (40 / 32) | `--space-5` / `--space-4` | `--fs-body` 600 | Toolbars, cards |
| `xs` | `h-control-xs` (32 / 28) | `--space-3` | `--fs-body-sm` 600 | Table row actions (pointer only). The touch hit area is padded to 44 with `::after` |

**States**
| State | brand | default | secondary | outline | ghost | destructive |
|---|---|---|---|---|---|---|
| hover | `--brand-hover` | `--primary-hover` | `--secondary-hover` | bg `--accent`, border `--border-strong` | bg `--accent` | `--destructive-hover` |
| focus-visible | 2px `--ring` outline, 2px offset (all variants) ||||||
| pressed | `translate(2px,2px)` + `--elev-hard-sm` | `translateY(1px)` | `translateY(1px)` | `translateY(1px)` | bg `--accent-strong` | `translateY(1px)` |
| disabled | `--disabled` / `--disabled-foreground`, border `--disabled-border`, no shadow, `aria-disabled` + tooltip with the reason ||||||
| loading | width locked, 16px spinner + present-tense label ("Checking in…"), `aria-busy`, non-interactive ||||||

**Behaviour.** Transitions use `--dur-fast` and `ease-standard` on background, transform and shadow. Loading prevents double submit (FE-06 double tap → one request). Prefer an enabled button that explains what's missing over a disabled one.

**Accessibility.** Native `<button type="button|submit">`. The label is the accessible name. Disabled buttons use `aria-disabled="true"` (stay focusable) + `aria-describedby` → reason. Loading: `aria-busy="true"`, and the label change is announced.

**RTL.** Icon positions swap automatically (flex + logical padding). Trailing arrows get `flip-rtl`.

**Do / Don't.** ✅ Verb-first, at most 2 words (Arabic: verbal noun). ✅ Primary at inline-end of a group. ❌ Two brand buttons on one screen. ❌ Butter for approvals. ❌ "OK" / "Yes".

**shadcn base + props.** `components/ui/button.tsx` (extend the cva variants).
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'brand' | 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'hero' | 'default' | 'sm' | 'xs';
  loading?: boolean;             // shows spinner, locks width, aria-busy
  loadingLabel?: string;         // e.g. "Checking in…"
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  flipTrailingIcon?: boolean;    // adds flip-rtl
  disabledReason?: string;       // renders tooltip + aria-describedby
  asChild?: boolean;
}
```

**Tokens.** `--brand`, `--brand-hover`, `--brand-foreground`, `--primary*`, `--secondary*`, `--destructive*`, `--accent`, `--accent-strong`, `--input`, `--border-strong`, `--ring`, `--disabled*`, `--elev-hard`, `--elev-hard-sm`, `--control-h*`, `--radius-pill`, `--dur-fast`, `--motion-standard`.
