# Stepper / wizard · v0.4

**Purpose.** Multi-step flows where order matters. MVP use: CSV import (FE-05). It can be reused for future onboarding flows.

**Anatomy.** Step list (`<ol>`, horizontal at `md+`, compact "Step 2 of 4 · Preview" header on mobile): each step has a 28px marker (number, or ✓ when done), title, and subtitle (the result, e.g. the file name) · step content · footer: Back (ghost, start) · secondary action · primary action (end) stating the outcome.

**Step marker states.** done (`--primary` fill, cream ✓, 3px ink underline) · current (`--brand` fill + 1.5px inset ink, 800 title, `aria-current="step"`, 3px ink underline) · upcoming (`--card` + 1px `--input`, muted number, hairline underline).

**CSV import steps (FE-05).**
1. **Upload:** "Download template" + file-upload `csv`.
2. **Preview:** server-validated rows. Summary "{n} rows · {ok} ready · {bad} need fixes". Toggle All / Errors. Invalid rows get a 3px `--error` inline-start bar, the bad cell in `--error` 600, and a Problem column with the reason. Actions: "Download errors" (CSV of the bad rows with reasons), primary "Import {ok} rows".
3. **Confirm:** summary + "Send invites now" checkbox (default on) + primary "Import {ok} employees".
4. **Result:** imported / skipped counts, links to the employee list and the error CSV.

**Behaviour.**
- Completed steps can be revisited until Confirm. After Confirm, the flow is locked.
- The primary button is disabled only when nothing can proceed (0 valid rows) and explains why.
- Leaving mid-flow asks "Discard import?".
- Only valid rows import (FE-05 AC).
- Long imports show progress and allow leaving the page; a notification arrives when done.

**Accessibility.** The step list is an `<ol aria-label="Import steps">`. On step change, focus moves to the step's `h2`. The error count is announced.

**RTL.** The step list and footer mirror. The Back arrow flips.

**Props.**
```ts
interface StepperProps { steps: { id: string; title: string; subtitle?: string }[]; currentId: string; completed: string[]; onStepClick?: (id: string) => void; children: React.ReactNode; footer: React.ReactNode; }
```

**Tokens.** `--primary*`, `--brand`, `--border-strong`, `--card`, `--input`, `--border`, `--error`, `--muted-foreground`.
