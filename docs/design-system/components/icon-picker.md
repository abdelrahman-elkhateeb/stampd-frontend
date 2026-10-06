# Icon picker · v0.4

**Purpose.** Choose the icon that identifies a leave type (FE-04). It replaces the per-type colour picker, because all leave types share `--cat-leave` (decision 21).

**Anatomy.** Label · trigger (preview tile 32 in `--cat-leave` + ink outline, icon name, chevron) · popover: 6×2 grid of 44px options · footnote "Icons already used by other leave types are marked In use".

**Icon set (curated, fixed order).** TreePalm, Thermometer, Siren, Banknote, Landmark, Baby, CalendarPlus, Heart, GraduationCap, Users, Moon, Briefcase. No free search: a closed set keeps the product consistent.

**Option states.** default (`--card` + 1px `--border`) · hover (`--accent`) · selected (`--cat-leave` + 2px inset `--border-strong`) · in use by another type (45% opacity, `--muted`, disabled; tooltip "Used by Sick leave") · focus-visible (ring).

**Behaviour.** Two leave types may not share an icon. The server validates this too. Archived types release their icon. Default suggestions for the seeded types (FE-04 defaults): Annual TreePalm · Sick Thermometer · Emergency Siren · Unpaid Banknote.

**Accessibility.** The trigger is a button with `aria-haspopup="dialog"`. The grid is a `radiogroup`: arrows move, Enter/Space selects, Esc closes. Each option's `aria-label` = icon name (+ "in use by {type}").

**RTL.** The grid mirrors. Icons don't flip (none are directional).

**Props.**
```ts
interface IconPickerProps { label: string; value: LeaveIconKey | null; onChange: (k: LeaveIconKey) => void; usedBy: Partial<Record<LeaveIconKey, string>>; }
type LeaveIconKey = 'tree-palm'|'thermometer'|'siren'|'banknote'|'landmark'|'baby'|'calendar-plus'|'heart'|'graduation-cap'|'users'|'moon'|'briefcase';
```

**Tokens.** `--cat-leave`, `--border-strong`, `--card`, `--border`, `--accent`, `--muted`, `--popover`, `--elev-pop`, `--ring`.
