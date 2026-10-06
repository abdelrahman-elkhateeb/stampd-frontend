# Time input

**Purpose.** Enter a time of day in company time: correction check-in/out (FE-08, FE-11), permission from/to (FE-08), company work hours (FE-04).

**Anatomy.** Label · segmented field: HH `:` MM (24h) · optional zone label at end ("AST") · `Clock` icon · helper "Shown in company time · Asia/Riyadh (UTC+3)".

**Variants.** `time` · `time-range` (from–to pair with the duration shown: "2h 00m") · `session` (inside the FE-11 correction editor: in/out pair + remove button).

**Sizes / density.** Field as Input (`h-control`). Segments are 2 characters, tabular, padding `--space-1`. The active segment is highlighted with `--brand` / `--brand-foreground` (the one allowed in-field butter use). Zone label `--fs-caption` `--muted-foreground`.

**States.** As Input (default, hover, focus, error, disabled). Error examples: "Check-out must be after check-in (08:02)"; "Sessions can't cross midnight" (FE-11).

**Behaviour.** Type digits to fill (auto-advance after 2). ↑/↓ = ±1 minute (hour segment ±1 hour), Shift+↑/↓ = ±15 minutes, ←/→ move between segments, Backspace clears a segment. Paste "17:10" is accepted. The value is `HH:mm` in company time; the API layer converts to UTC with the company timezone and the selected date. The zone label shows only on correction forms and when the device zone ≠ company zone.

**Accessibility.** `role="group"` + `aria-labelledby` the label. Each segment is a `spinbutton` with `aria-valuenow/min/max` and `aria-label` ("Hours", "Minutes"). Errors are linked with `aria-describedby`.

**RTL.** The segment order stays HH:MM (`dir="ltr"` on the segment group). The zone label and icon sit at inline-end.

**Do / Don't.** ✅ 24-hour always. ❌ AM/PM. ❌ Device-time defaults.

**shadcn base + props.** Custom (react-aria `useTimeField` recommended) styled as Input.
```ts
interface TimeInputProps {
  label: string;
  value: string | null;          // 'HH:mm' company time
  onChange: (v: string | null) => void;
  min?: string; max?: string;
  showZone?: boolean;            // forces "AST" label
  companyTimeZone: string;       // for helper text
  error?: string;
  helperText?: string;
}
```

**Tokens.** As Input + `--brand`, `--brand-foreground` (active segment), `--muted-foreground`.
