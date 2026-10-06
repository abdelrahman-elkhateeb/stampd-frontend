# Date picker

**Purpose.** Pick one calendar day: attendance day (FE-11), WFH date, holiday date, joining date, correction date.

**Anatomy.** Label · field (formatted short date + `Calendar` icon at end, typeable) · popover: header (prev, month title, next) · weekday row · 6×7 day grid · optional Hijri caption under the month title.

**Variants.** `single` · `month` (month/year picker for FE-06/FE-14) · `inline` (grid always visible, e.g. inside the correction drawer).

**Sizes / density.** Field: as Input. Popover width 324, padding `--space-3`, cells 40×40 (36 compact), radius `--radius-pill` for day states. Weekday labels `--fs-caption` 600 `--muted-foreground`.

**Day states**
| State | Style |
|---|---|
| default | `--foreground` |
| outside month | `--disabled-foreground` |
| non-working day (company settings) | cell `--muted`, text `--subtle-foreground`, radius md |
| today | `--brand-subtle` + 1.5px `--border-strong` inset ring, 800 weight, `aria-current="date"` |
| selected | `--primary` / `--primary-foreground`, 700 |
| holiday | 3px underline in `--status-holiday` + holiday name in the tooltip/aria-label |
| disabled (min/max, invalid) | `--disabled-foreground`, not selectable, reason in the tooltip |
| hover | `--accent` |
| focus-visible | 2px `--ring` |

**Behaviour.** The field accepts typed dates in the locale format and parses on blur. Arrow keys move by day, PgUp/PgDn by month, Shift+PgUp/PgDn by year, Home/End to the week start/end, Enter selects. The week start comes from company settings. Values are plain `YYYY-MM-DD` (no time, no zone).

**Accessibility.** The popover is a `dialog` containing a `grid`. Each cell's `aria-label` is the full date ("Wednesday 14 October 2026"), plus "holiday: {name}" / "non-working day". The selection is announced. Escape returns focus to the field.

**RTL.** The grid mirrors (week start on the right). Prev/next arrows flip. Month names are Arabic through Intl. The Hijri caption follows `formatting.md`.

**Do / Don't.** ✅ Disable impossible dates instead of erroring afterwards. ❌ Native `<input type="date">` (inconsistent RTL and digits).

**shadcn base + props.** `calendar.tsx` (react-day-picker v9) + `popover.tsx`.
```ts
interface DatePickerProps {
  label: string;
  value: string | null;                 // 'YYYY-MM-DD'
  onChange: (ymd: string | null) => void;
  min?: string; max?: string;
  isDisabled?: (ymd: string) => string | false;   // returns reason
  workingDays: number[];                // 0=Sun … 6=Sat, from company settings
  weekStartsOn: 0 | 1 | 6;
  holidays?: { date: string; name: string }[];
  showHijri?: boolean;
  variant?: 'single' | 'month' | 'inline';
  error?: string;
}
```

**Tokens.** `--popover`, `--elev-pop`, `--muted`, `--subtle-foreground`, `--brand-subtle`, `--border-strong`, `--primary*`, `--status-holiday`, `--accent`, `--ring`, `--disabled-foreground`, `--radius-pill`, `--radius-md`.
