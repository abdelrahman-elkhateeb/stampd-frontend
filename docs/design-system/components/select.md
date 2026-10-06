# Select / Combobox

**Purpose.** Choose one option from a list: leave type, department, manager (searchable), rows per page, request type.

**Anatomy.** Label · trigger (value with optional leading swatch or icon, chevron at end) · popover listbox (options: optional swatch/icon, label, optional meta at end, check for the selected one) · optional search input (Combobox).

**Variants.** `select` (≤ 8 options, Radix Select) · `combobox` (> 8 options or remote search: manager, employee; cmdk in a Popover) · `multi` (filters: checkboxes in options, count in the trigger "Status · 2").

**Sizes / density.** Trigger `h-control` (48 / 36), padding-inline `--space-3`. Options `h-control-sm` (40 / 32), padding `--space-2`, radius `--radius-sm`. Popover `--popover`, 1px `--border`, `--elev-pop`, radius `--radius-md`, max-height 320 (scrolls).

**States.** Trigger: as Input (default, hover, focus, open = `--border-strong` + ring, error, disabled). Options: default · hover/active (`--accent`) · selected (`Check` icon at end + `aria-selected`) · disabled (`--disabled-foreground` + reason meta, e.g. "Not eligible").

**Behaviour.** Opening focuses the selected option. Typing jumps to matching options (select) or filters (combobox, 200ms debounce for remote). Esc closes and returns focus. On mobile (below `md`), it opens as a bottom sheet with a search field when it is a combobox. Leave-type options show the type icon + remaining balance as meta ("14 left").

**Accessibility.** Radix Select / cmdk give `combobox`, `listbox` and `option` roles. The trigger has `aria-expanded` and `aria-controls`. The selected state is never colour-only (check icon). Async results are announced: "8 results".

**RTL.** The chevron moves to the start side in RTL automatically. The popover aligns to the trigger's inline-start edge.

**Do / Don't.** ✅ Use a combobox for people pickers. ✅ Show balance meta for leave types. ❌ Use a select for 2–3 options (use a radio group or segmented control).

**shadcn base + props.** `select.tsx`, `command.tsx` + `popover.tsx`.
```ts
interface SelectFieldProps<T extends string> {
  label: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: LucideIcon; swatch?: string /* token var */; meta?: string; disabled?: boolean; disabledReason?: string }[];
  searchable?: boolean;        // forces combobox
  loadOptions?: (q: string) => Promise<SelectFieldProps<T>['options']>;
  placeholder?: string;
  error?: string;
  helperText?: string;
}
```

**Tokens.** `--popover`, `--border`, `--elev-pop`, `--accent`, `--input`, `--border-strong`, `--ring`, `--disabled-foreground`, `--cat-*` (swatches), `--control-h*`, `--radius-md`, `--radius-sm`.
