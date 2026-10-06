# Progress bar · v0.4

**Purpose.** Show progress or proportion: shift progress (Today card), setup checklist, uploads, leave usage, balance segments.

**Anatomy.** Track (`--muted` + 1px inset `--border-strong`) · fill(s) · a 1.5px ink tick at the fill end · optional label/value row above.

**Variants.** `determinate` (one fill: `--brand` for shift and setup progress, `--cat-leave` for usage, `--foreground` for uploads) · `segmented` (balance; see balance-card) · `indeterminate` (30% fill sliding across over 1.4 s; static at 30% under reduced motion).

**Sizes.** `sm` 6px (inline, uploads) · `md` 10px (default) · `lg` 14px (segmented). Radius pill.

**Behaviour.** Width transitions over `--dur-slow`. Values are clamped to 0–100. Never animate on page load. Uploads switch from indeterminate to determinate once the size is known.

**Accessibility.** Determinate: `role="progressbar"` + `aria-valuenow/min/max` + `aria-label` + `aria-valuetext` ("2 of 5 steps"). Segmented: `role="img"` + a full sentence. Indeterminate: `aria-busy` on the region + "Uploading…" text.

**RTL.** It fills from inline-start (right in RTL).

**Do / Don't.** ❌ Colour-coded good/bad progress. ❌ Progress bars for things that aren't progress (use a stat).

**Props.**
```ts
interface ProgressBarProps { value?: number; max?: number; label: string; valueText?: string; size?: 'sm' | 'md' | 'lg'; tone?: 'brand' | 'leave' | 'ink'; indeterminate?: boolean; }
```

**Tokens.** `--muted`, `--border-strong`, `--brand`, `--cat-leave`, `--foreground`, `--dur-slow`, `--radius-pill`.
