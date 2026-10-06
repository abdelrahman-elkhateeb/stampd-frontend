# Segmented control

**Purpose.** Switch between 2–4 views of the same content: Day/Week/Month, Month/Week/List (calendar), Calendar/List (FE-06), Chart/Table (data viz).

**Anatomy.** Pill track (`--muted`, padding `--space-1`) · segments (pill buttons, label ± icon).

**Sizes / density.** Track height `h-control-sm` (40 / 32). Segment padding `--space-1-5` × `--space-4`. Text `--fs-body` 600 (`--fs-body-sm` compact).

**States.** unselected (transparent / `--foreground`) · hover (`--accent-strong`) · selected (`--primary` / `--primary-foreground`) · focus-visible (2px `--ring` inside the segment) · disabled segment (`--disabled-foreground`).

**Behaviour.** Changes the view immediately and keeps it in the URL (`?view=list`). ←/→ move and select. Never use it for form input that's applied on Save.

**Accessibility.** `role="radiogroup"` with `role="radio"` segments (or Radix ToggleGroup type="single"), named by `aria-label` ("View").

**RTL.** The segment order mirrors.

**Do / Don't.** ✅ Max 4 segments. ❌ Using it as tabs for different content (use Tabs).

**shadcn base + props.** `toggle-group.tsx` (type="single").
```ts
interface SegmentedControlProps<T extends string> { 'aria-label': string; value: T; onValueChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon }[]; size?: 'default' | 'sm'; }
```

**Tokens.** `--muted`, `--accent-strong`, `--primary*`, `--ring`, `--control-h-sm`, `--radius-pill`.
