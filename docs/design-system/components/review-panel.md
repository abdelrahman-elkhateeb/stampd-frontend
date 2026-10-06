# Review panel (composite) · v0.4

**Purpose.** Everything a manager needs to decide on a request in one place (FE-10): a split view at `lg+`, a drawer at `md`, a page on mobile. Decision rules: `patterns/approve-reject.md`.

**Anatomy.**
- **List column** (400): header "Pending · {n} · oldest first", then items (avatar 32, name, "{type} · {dates} · {age}"). The selected item is `--brand-subtle` with a 3px ink inline-start bar.
- **Panel:**
  - header: avatar 44, name, department, "requested {date, time}", status tag;
  - body in two columns:
    - left: category chip, dates + working days, "Balance after approval: 10 → 7", the employee's note on `--muted`;
    - right: "Also out from your team" list, threshold warning ("2 of 6 in Finance out on 12 Oct"), "Request history (n)" link → timeline;
  - pinned footer: "Add comment" link · Reject (outline, destructive text) · Approve (primary).

**Variants.** `leave` (with balance) · `wfh` / `trip` / `permission` (no balance; conflicts still shown) · `cancellation` (Accept / Decline cancellation) · `correction-info` (FE-10: "Reviewed by HR", no actions) · `decided` (Decided tab: read-only, the timeline expanded).

**Behaviour.**
- Selecting an item loads the panel in place. The URL is `?request={id}`, and ↑/↓ moves through the list.
- After a decision, the next item opens and focus moves to its Approve button. When the list empties, the panel shows the "You're all caught up" empty state.
- Conflict "Already approved by {name}" replaces the footer (FE-10 AC).
- The manager never sees their own requests (FE-10 AC).
- Data: balance after (BE preview), teammates out (BE-12 availability).

**Accessibility.** The list is `role="listbox"` (single select) or links with `aria-current`. The panel is a `region` labelled "Request from {name}". Decision buttons are always reachable with Tab in this order: comment → Reject → Approve.

**RTL.** The list sits on the right and the panel on the left. The footer order mirrors.

**Props.**
```ts
interface ReviewPanelProps { request: ApprovalRequest; balance?: { before: number; after: number }; teammatesOut: { name: string; type?: RequestType; date: string }[]; threshold?: { out: number; total: number; date: string }; historyCount: number; onApprove: (comment?: string) => Promise<void>; onReject: (reason: string) => Promise<void>; variant: 'leave' | 'wfh' | 'trip' | 'permission' | 'cancellation' | 'correction-info' | 'decided'; }
```

**Tokens.** `--card`, `--border`, `--brand-subtle`, `--border-strong`, `--muted`, `--cat-*`, `--status-pending*`, `--warning`, `--primary*`, `--destructive`, `--input`.
