# Date-range picker

**Purpose.** Pick a start and end day: leave (FE-07), WFH range, business trip, report ranges (FE-14).

**Anatomy.** Field (start → end, live "N working days" pill at end) · popover with 2 months side by side (`md+`) or 1 (mobile, as a sheet) · range band · footer: live summary (start) + Clear / Apply (end) · optional presets column (reports: This month, Last month, This leave year, Custom).

**Variants.** `leave` (counts working days, shows the balance after, excludes weekends and holidays) · `generic` (calendar days) · `report` (presets, max 13 months, per FE-14).

**Sizes / density.** As Date picker. The range band is `--muted` and continuous across the cells; the start and end are `--primary` circles.

**Day states (in addition to Date picker).** in-range = `--muted` band · range start/end = primary circle · non-working day inside the range = 45° hatch (`--muted` / `--card`) and **not counted** · holiday inside the range = hatch + holiday underline, listed as excluded in the summary.

**Behaviour.** The first click sets the start and the second sets the end. Hovering previews the range. Clicking before the start resets the start. The summary updates live through the server preview (FE-07): "5 working days · balance 14 → 9 · excludes Thu 22 Oct (company day off)". Teammate conflicts show as a warning note. Validation messages come from the preview and appear inline (insufficient balance, overlap, no working days). The report variant shows "Pick up to 13 months" and disables Export beyond that.

**Accessibility.** As Date picker. Range cells get `aria-selected`. The summary is an `aria-live="polite"` region. Each endpoint's aria-label includes "start date" / "end date".

**RTL.** Months order right to left (the earlier month on the right). The band and arrows mirror.

**Do / Don't.** ✅ Show the count and balance while selecting. ❌ Count non-working days in leave ranges.

**shadcn base + props.** `calendar.tsx` mode `range` + `popover.tsx` / `sheet.tsx`.
```ts
interface DateRangePickerProps {
  label: string;
  value: { from: string | null; to: string | null };
  onChange: (v: { from: string | null; to: string | null }) => void;
  variant?: 'leave' | 'generic' | 'report';
  preview?: { workingDays: number; balanceBefore?: number; balanceAfter?: number; excluded: { date: string; reason: string }[]; error?: string };
  presets?: { label: string; range: { from: string; to: string } }[];
  maxSpanMonths?: number;      // report: 13
  workingDays: number[]; weekStartsOn: 0 | 1 | 6; holidays?: { date: string; name: string }[];
}
```

**Tokens.** As Date picker + `--warning` (conflicts), `--error`.
