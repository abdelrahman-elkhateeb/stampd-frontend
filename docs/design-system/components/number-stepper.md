# Number stepper · v0.4

**Purpose.** Enter small bounded numbers: default allowance, grace minutes (FE-04), balance adjustment (FE-05), half-day counts.

**Anatomy.** Label · group: − button (48 square, `--muted`) · value (tabular, 700, centred, width 72) · unit suffix ("days", "min") · + button · helper/error.

**Variants.** `unsigned` (≥ 0) · `signed` (adjustments: shows "+2" / "−1", requires a reason field next to it) · `decimal` (step 0.5 where half days are allowed).

**Sizes.** Height `h-control`, and each button is `size-control`. Compact: 36.

**States.** As Input. The − or + button is disabled at the min or max. Error example: negative allowance → "Allowance can't be negative" and Save is disabled (FE-04 AC).

**Behaviour.** Type directly; ↑/↓ = ±step, PgUp/PgDn = ±10×step, Home/End = min/max. Holding a button repeats after 400 ms at 10/s. Accepts both digit systems; displays via Intl. Empty on blur → restores the previous value.

**Accessibility.** react-aria `useNumberField`: the input is a `spinbutton` with `aria-valuenow/min/max`, and `aria-valuetext` includes the unit ("21 days"). The buttons are labelled "Increase" / "Decrease" and are `tabIndex=-1` (the keyboard uses arrows on the input).

**RTL.** − sits at inline-start, so it moves to the right in RTL; the value and unit order follow the locale.

**Props.**
```ts
interface NumberStepperProps { label: string; value: number | null; onChange: (v: number | null) => void; min?: number; max?: number; step?: number; unit?: string; signed?: boolean; error?: string; helperText?: string; }
```

**Tokens.** `--input`, `--muted`, `--border`, `--border-strong`, `--ring`, `--error`, `--control-h`.
