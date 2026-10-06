# Radio group

**Purpose.** One exclusive choice from 2–5 visible options: day part (Full day / First half / Second half), employment type, notification frequency.

**Anatomy.** Legend · options (20px circle + label + optional description). Stacked vertically by default; inline when there are ≤ 3 short labels.

**Variants.** `default` · `card` (each option is a selectable card: 2px `--border-strong` + `--brand-subtle` when selected, as in the board 09 "Selected" card).

**Sizes / density.** Circle 20, selected = 6px `--primary` ring around a `--card` centre. Gap `--space-3`. Hit area ≥ 44.

**States.** unselected (1.5px `--input`) · selected · hover (`--input-hover`) · focus-visible (2px `--ring`, 2px offset) · disabled (`--disabled*`) · error (legend + message `--error`).

**Behaviour.** Arrow keys move **and** select (roving tabindex); Tab enters and leaves the group. No default selection when the choice matters (e.g. day part), so the user must choose.

**Accessibility.** Radix RadioGroup (`radiogroup` / `radio`). The group is named by its legend. Descriptions are linked with `aria-describedby`.

**RTL.** Arrow-key direction follows the reading direction (Radix `dir`).

**Do / Don't.** ✅ Use it for ≤ 5 options. ❌ For more than 5 (use Select). ❌ For an immediate view toggle (use Segmented control).

**shadcn base + props.** `radio-group.tsx`.
```ts
interface RadioGroupFieldProps<T extends string> { legend: string; value: T | null; onChange: (v: T) => void; options: { value: T; label: string; description?: string; disabled?: boolean }[]; variant?: 'default' | 'card'; orientation?: 'vertical' | 'horizontal'; error?: string; }
```

**Tokens.** `--input`, `--input-hover`, `--primary`, `--card`, `--ring`, `--border-strong`, `--brand-subtle`, `--disabled*`, `--error`.
