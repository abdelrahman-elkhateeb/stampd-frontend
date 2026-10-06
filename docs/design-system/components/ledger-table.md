# Ledger table · v0.4

**Purpose.** Prove a leave balance entry by entry (FE-07 balance detail, FE-05 admin balance view with adjustments).

**Anatomy.** A Table variant with columns: Date (short) · Entry type · Details (truncated, full text in the tooltip, links to the request) · Change (signed, tabular, `text-end`) · Available (running balance, tabular, `text-end`) · totals row: "Available now · Sum of all entries · {n}" (800, top border 1.5px `--border-strong`).

**Entry types (FE-07).**
| Type | Sign | Colour |
|---|---|---|
| Allowance | + | `--success` |
| Adjustment (reason required; shows actor) | ± | `--success` for + / `--foreground` for − |
| Reservation (pending request) | − with "(pending)" | `--status-pending` |
| Release (withdrawn/rejected) | + | `--success` |
| Deduction (taken / approved) | − | `--foreground` |
| Restoration (cancelled) | + | `--success` |

The sign is always shown, so meaning never depends on colour.

**Rules.** The running balance and totals come from the API and must equal the balance card's "available" exactly (FE-07 AC). Sorted by date ascending (oldest first, so the running column reads naturally), with year filter chips. Admin view (FE-05) adds an "Adjust balance" button: number stepper (signed) + required reason → it appears as an Adjustment row immediately.

**States.** As Table (loading, empty "No entries this leave year", error).

**Accessibility.** The caption is "Annual leave ledger, 2026". The Change cell sr text reads "plus 21" / "minus 3, pending".

**RTL.** Numeric columns stay `text-end`. The sign comes before the number in both languages ("−3").

**Props.**
```ts
interface LedgerTableProps { leaveTypeName: string; year: number; entries: { date: string; type: 'allowance' | 'adjustment' | 'reservation' | 'release' | 'deduction' | 'restoration'; details: string; href?: string; amount: number; balanceAfter: number; actor?: string; reason?: string }[]; available: number; onAdjust?: (amount: number, reason: string) => Promise<void>; }
```

**Tokens.** As Table + `--success`, `--status-pending`, `--border-strong`.
