# Weekday toggle group · v0.4

**Purpose.** Choose working days (FE-04 company settings). It is reusable for any multi-day selection (e.g. a recurring permission, if added later).

**Anatomy.** Label · 7 round 44px toggle buttons with 2-letter labels (EN: Su Mo Tu We Th Fr Sa; AR: ح ن ث ر خ ج س) · summary line ("5 working days · Sun–Thu") · optional note.

**States.** pressed (`--primary` / `--primary-foreground`, 700) · unpressed (`--card`, 1px `--input`) · hover (`--accent`) · focus-visible (ring) · disabled (non-admin view).

**Behaviour.**
- Order starts at the company week start. The full day name is in `aria-label` and the tooltip.
- At least one day must stay selected: deselecting the last one does nothing, with the inline message "Pick at least one working day".
- The summary updates live.
- Saving shows the note "Applies to everyone from their next load" (FE-04 AC). Changes affect calendars, previews and the attendance close from the next day.

**Accessibility.** Radix ToggleGroup `type="multiple"`, `role="group"` + `aria-label`. Each item is a button with `aria-pressed`. The summary is in a polite live region.

**RTL.** The row mirrors. Arabic uses one-letter day abbreviations with full names in `aria-label`.

**Props.**
```ts
interface WeekdayToggleProps { label: string; value: number[] /* 0=Sun … 6=Sat */; onChange: (days: number[]) => void; weekStartsOn: 0 | 1 | 6; disabled?: boolean; }
```

**Tokens.** `--primary*`, `--card`, `--input`, `--accent`, `--ring`, `--muted-foreground`.
