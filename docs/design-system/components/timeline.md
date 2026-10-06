# Timeline · v0.4

**Purpose.** Show what happened to a record and who did it. Two variants share one component:
- **status** (FE-08 request detail, FE-10 review history): submitted → decided → cancellation requested → cancelled.
- **changes** (FE-04 settings history, FE-05 employee history, FE-06 day drawer, FE-11 day history): old → new values with reason.

**Anatomy · status.** A vertical `<ol>`, **oldest first**. Each event: 28px marker (status tint + icon, from the status tokens) · title (status word, 700) + actor ("by Khalid Al-Harbi") · `<time>` in company time · optional comment bubble (`--muted`, 13/19). The connector is a 2px `--border` line, solid between past events and dashed to the final "Waiting for {approver}" row while the request is pending (outline marker, `Clock` icon, "Next step").

**Anatomy · changes.** A vertical list, **newest first**. Each entry:
- action + actor, plus a source tag on the right: `Manual` (info tint) · `Approved request #id` (link) · `System` (neutral);
- one row per changed field: label · `<del>` old (status colour or muted) · arrow (`flip-rtl`, sr "changed to") · `<ins>` new (700);
- the reason (required for manual changes) on `--muted`;
- the timestamp.

**Rules.**
- Old values are never hidden or deleted (FE-11).
- Marker colour comes from the status, and the label always names it.
- Actor names respect permissions: employees see "HR" instead of a person's name if the tenant setting `showCorrectorName` is off.
- More than 10 events: show the latest 5 and a "Show all ({n})" button.

**Accessibility.** Status: `<ol aria-label="Request history">`, with each `<li>` read as "{status} by {actor}, {date}. {comment}". Changes: `<del>` / `<ins>` plus visually hidden "was" / "now" prefixes for screen readers that don't announce them.

**RTL.** Markers and the connector sit at inline-start (right). Arrows flip.

**Props.**
```ts
type StatusEvent = { kind: 'submitted' | 'approved' | 'rejected' | 'withdrawn' | 'cancel-requested' | 'cancelled' | 'next'; actor?: string; at?: string; comment?: string };
type ChangeEvent = { action: string; actor: string; at: string; source: { kind: 'manual' | 'request' | 'system'; requestId?: string }; fields: { label: string; from: string; to: string; fromTone?: AttendanceStatus | RequestStatus; toTone?: AttendanceStatus | RequestStatus }[]; reason?: string };
interface TimelineProps { variant: 'status' | 'changes'; events: StatusEvent[] | ChangeEvent[]; collapseAfter?: number; }
```

**Tokens.** `--status-*`, `--border`, `--muted`, `--muted-foreground`, `--info*`, `--success`, `--error`.
