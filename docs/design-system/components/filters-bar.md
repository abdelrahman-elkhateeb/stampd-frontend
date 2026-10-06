# Filters bar

**Purpose.** Narrow a list or report: search, date/date range, department, manager, employee, status, type (FE-05, FE-10, FE-11, FE-12, FE-14).

**Anatomy.** Row 1: search input (260px) · filter triggers (outline `h-control-sm` buttons opening Select/DateRange popovers) · spacer · page-level actions (Export CSV, `secondary`). Row 2 (only when filters are active): "Active:" label · removable chips (status chips use status colours; others neutral) · "Clear all" link · spacer · result count (`role="status"`).

**Variants.** `inline` (desktop) · `sheet` (mobile: a "Filters · 2" button opens a bottom sheet with all filters and Apply / Reset).

**Sizes / density.** Controls `h-control-sm` (40 / 32). Gap `--space-2`. Wraps on narrow widths. Search has a `/` keyboard shortcut hint (`kbd`).

**States.** A trigger with active values: 1.5px `--border-strong` + `--brand-subtle` + count ("Status · 2"). Disabled filters (no data or permission) are hidden, not disabled.

**Behaviour.** Filters apply immediately (no Apply on desktop). Search is debounced 300ms. All state goes in the URL query (`?dept=…&status=late,missing&from=…`) so reports can be bookmarked (FE-14). Presets for dates live in the date-range popover. "Clear all" resets to the defaults, not to empty (e.g. date = today on FE-11).

**Accessibility.** Wrap in `<form role="search" aria-label="Filter attendance">`. Remove buttons: "Remove Late filter". The result count is announced politely after changes ("16 results").

**RTL.** Order mirrors. The search icon sits at inline-start.

**Do / Don't.** ✅ Reflect filters in the URL. ❌ Hiding active filters inside a collapsed panel on desktop.

**shadcn base + props.** Composite of Input, Select, DateRangePicker, Badge, Sheet.
```ts
interface FiltersBarProps<F extends Record<string, unknown>> { value: F; onChange: (f: F) => void; fields: FilterFieldDef<keyof F>[]; resultCount?: number; actions?: React.ReactNode; defaults: F; searchPlaceholder?: string; }
```

**Tokens.** `--input`, `--border-strong`, `--brand-subtle`, `--secondary`, `--status-*`, `--muted-foreground`, `--control-h-sm`.
