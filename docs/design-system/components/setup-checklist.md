# Setup checklist · v0.4

**Purpose.** Guide a new Admin through the first-run setup (FE-02), shown on the Admin dashboard (FE-13) until it's dismissed or complete.

**Anatomy.** Hero card: title "Set up your workspace" + "{done} of 5 done · everything is optional" + dismiss icon button · progress bar (`brand`) · rows (min-height 52): status circle (done = ink fill + cream check; todo = 1.5px `--input` outline) · title + one-line subtitle (live data: "3 holidays added") · chevron.

**Steps (FE-02 order).** Confirm company settings · Add holidays · Review leave types · Add employees · Invite employees. Each row links to its screen.

**Behaviour.**
- Done is detected from data: settings saved once, ≥ 1 holiday, leave types reviewed (visited + saved), ≥ 1 employee, ≥ 1 invite sent.
- Steps are shortcuts, never blockers (FE-02).
- When all are done: the card collapses into a one-line "Workspace set up ✓" for 7 days.
- Dismissed: hidden for everyone in the company (stored server-side), and recoverable from Settings › "Show setup checklist".
- For a brand-new company it replaces empty tiles and charts (FE-13 AC).

**Variants.** `card` (dashboard hero) · `compact` (a sidebar or settings banner: progress bar + "Continue setup" link).

**Accessibility.** `<section aria-labelledby>`. Rows are links named "{step}, done" / "{step}, not done". The progress bar's `aria-valuetext` is "2 of 5 steps done".

**RTL.** Rows mirror and chevrons flip.

**Props.**
```ts
interface SetupChecklistProps { steps: { id: 'settings' | 'holidays' | 'leave-types' | 'employees' | 'invites'; title: string; subtitle: string; done: boolean; href: string }[]; onDismiss: () => Promise<void>; variant?: 'card' | 'compact'; }
```

**Tokens.** `--card`, `--border-strong`, `--elev-hard`, `--brand`, `--primary`, `--input`, `--border`, `--muted-foreground`.
