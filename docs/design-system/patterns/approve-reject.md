# Pattern · Approve / reject

Used by: FE-10 (approvals inbox, review panel, dashboard), FE-11 (correction requests queue), FE-13 (company-scope approvals).
Target: Dashboard → Pending → decision in **under 3 clicks** (FE-10).

## Anatomy of a decision card (mobile) / review panel (desktop)
1. Requester: avatar (40), name, department, "requested 2h ago" (relative, tooltip = full timestamp).
2. Status tag `Pending` (or `Pending · step 1 of 2` for chains) at inline-end.
3. Request block on `--background`: category chip (`--cat-*`) + dates (`formatRange`), days counted, **balance before → after** (leave), the employee's note in quotes.
4. Context: teammates already out on those dates, from BE-12 or dashboard data, shown as a `--warning` note with `TriangleAlert`: "Omar is also off on 12 Oct (2 of 6 in Finance out)".
5. Actions: **Reject** (outline button, `text-destructive`) at inline-start, **Approve** (primary ink) at inline-end. Both are `h-control`, full width on mobile (2-column grid, gap 10).

The decision card is the one allowed hard-shadow hero on the approvals screen (mobile). In the desktop list it is a flat row.

## Behaviour
| Step | Spec |
|---|---|
| Approve | One click, **no confirm**. Button loading state → success. On mobile the card collapses over 280ms (`--dur-slower`, `ease-exit`) into a one-line receipt ("Approved · Omar Farouk · WFH Thu 8 Oct", 0.7 opacity), then leaves the list. Toast "Approved {name}'s {type}" with **Undo** (8 s). The server commits after the undo window. The badge count decrements immediately (FE-10). |
| Optional comment | "Add comment" link expands a textarea before Approve. It is optional. |
| Reject | Opens the destructive confirm (`patterns/destructive-confirm.md`) with a **required** reason. Clicking Reject with an empty reason gives the field error "Add a reason so {name} knows what to change". |
| Cancellation requests | Same inbox and card. Actions: **Accept cancellation** (primary) / **Decline cancellation** (outline, reason required). |
| Already decided | If the API returns a conflict: replace the actions with an info note "Already approved by {name} · {time}", refresh the list, no toast (FE-10 AC). |
| Own requests | Never appear in the approver's inbox (FE-10). |
| Attendance corrections for managers | Shown as information only, labelled "Reviewed by HR"; no actions (FE-10, FE-08). |
| Bulk (desktop) | Select rows → ink selection bar "Approve {n}". **No bulk reject** (each needs its own reason). The bulk approve gets a single Undo toast. |
| Multi-step chains | Tag "Pending · step {k} of {n}". The detail drawer shows the timeline: approver, decision, time, comment. Only the current approver sees actions. |

## Accessibility
- The card is an `<article aria-labelledby={nameId}>`. Buttons say "Approve" / "Reject". The accessible description includes the request summary: `aria-describedby` → the request block.
- After approve, focus moves to the next card's Approve button (or to the "All caught up" heading when the list is empty), and a polite live message announces "Approved Sara's leave. Undo available."
- Undo is reachable with F8 (toast region) and Tab.

## Do / Don't
- ✅ Show the balance impact and conflicts on the card; the decision should never need a second screen.
- ✅ Keep Approve at inline-end, where the thumb rests.
- ❌ Don't use butter on approval buttons. Butter is reserved for check-in and the active nav item.
- ❌ Don't confirm approvals. ❌ Don't allow a reject without a reason.

## Tokens
`--card`, `--border-strong`, `--elev-hard`, `--primary(-foreground)`, `--destructive`, `--input`, `--status-pending(-bg)`, `--cat-*`, `--warning`, `--background`, `--dur-slower`, `--motion-exit`.
