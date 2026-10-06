# Correction editor (composite) · v0.4

**Purpose.** HR edits a day's attendance sessions with a mandatory reason (FE-11). It opens in a `wide` drawer (640).

**Anatomy.**
- header: employee avatar + "Correct attendance" + "{name} · {day} · shift {start–end}";
- **Sessions** list (one row per session):
  - label "Session n";
  - check-in Time input;
  - "–";
  - check-out Time input (zone label "AST");
  - remove icon button (`Trash2`, `--destructive`).
- "Add session" (dashed outline pill);
- **Result** preview on `--muted`: status before → after (`<del>` / `<ins>`, status colours) + worked duration;
- Reason textarea (required, "kept in history");
- footer: Cancel · Save correction.

**Validation (field-level, company time).** Check-out after check-in · no overlapping sessions · sessions can't cross midnight · at most one open session, and only for today. Errors attach to the exact input: "Check-out must be after check-in (13:15)".

**Behaviour.**
- The live result calls the server recalculation 300 ms after an edit (same rules as payroll and reports).
- Removing the only session opens the confirm "Mark {name} as absent for {day}?".
- Save is disabled until the reason is filled ("Add a reason to save", FE-11 AC).
- On save: the drawer closes, the row updates with the "Corrected" flag, the day leaves the exceptions queue, a toast confirms, and the history timeline gains a `changes` entry.
- From an employee's correction request, the proposed times are prefilled and tagged "Proposed by {name}". Approve/Reject in the queue use the approve-reject pattern.

**Accessibility.** Each session is a `role="group"` labelled "Session 1". The remove button is labelled "Remove session 1". The result region is `aria-live="polite"`.

**RTL.** Rows mirror. Time segments stay LTR.

**Props.**
```ts
interface CorrectionEditorProps { employee: { name: string; userId: string }; day: string; shift: { start: string; end: string }; sessions: { in: string | null; out: string | null; proposed?: boolean }[]; proposedBy?: string; preview: (sessions: Session[]) => Promise<{ statusBefore: AttendanceStatus; statusAfter: AttendanceStatus; workedMinutes: number }>; onSave: (sessions: Session[], reason: string) => Promise<void>; }
```

**Tokens.** `--card`, `--border-strong`, `--muted`, `--status-*`, `--destructive`, `--input`, `--error`, `--border`.
