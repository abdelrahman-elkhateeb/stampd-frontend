# Tooltip · v0.4

**Purpose.** Short supplementary text on hover or focus: icon-button names, truncated text, disabled reasons, full dates behind relative times, calendar and chart details.

**Anatomy.** Inverse bubble (`--inverse` / `--inverse-foreground`, 18.59 · 16.50), 12/16 text 500, padding 6/10, radius sm, max-width 240, 6px arrow, 6px offset from the trigger.

**Behaviour.**
- Opens after 500 ms on hover (0 ms when moving between adjacent tooltips) and immediately on keyboard focus.
- Closes on Esc, blur or pointer leave.
- Never on touch devices (long-press does nothing). Information must exist elsewhere: the tooltip is **supplementary only**.
- Placement: top by default; flips when there's no room.

**Rules.** No interactive content (use a Popover). At most 2 short lines. Text is the same as the `aria-label` for icon buttons.

**Accessibility.** Radix Tooltip: content linked by `aria-describedby`. For icon buttons, the `aria-label` is the name, and the tooltip repeats it visually only (`aria-hidden` content) to avoid double reading.

**RTL.** The arrow and side placement mirror.

**Props.**
```ts
interface TooltipProps { content: string; side?: 'top' | 'bottom' | 'start' | 'end'; children: React.ReactElement; delayMs?: number /* default 500 */; }
```

**Tokens.** `--inverse`, `--inverse-foreground`, `--radius-sm`, `--fs-caption`, `--dur-instant`.
