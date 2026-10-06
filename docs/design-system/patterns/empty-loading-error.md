# Pattern · Empty / loading / error

Every list, card and page section implements all four states: **data · loading · empty · error** (FE-01, FE-15).

## Decision table
| Situation | Show | Copy | Action |
|---|---|---|---|
| Loading < 300 ms | Nothing (keep the previous content) | — | — |
| Loading 300 ms – 10 s | Skeleton with the final layout's dimensions | — | — |
| Loading > 10 s (CSV export) | Progress toast with spinner | "Preparing CSV · 204 rows" | Notify when ready |
| First use | Empty state + doodle | What lives here + why it helps | Hero CTA (brand button) |
| Done / inbox zero | Empty state + doodle | "You're all caught up" | Link to history |
| No filter results | Empty state, search icon only, no doodle | Restate the filters in words | "Clear filters" |
| Section failed | Section error; the rest of the page keeps working | What failed + what still works | "Try again" + support code |
| Offline | Top banner + queued actions | "You're offline. Check-in will send when you reconnect." | Auto-retry |
| No permission | Page-level 403 | Who can grant access | "Request access" / Back |
| Not found | Page-level 404 | "This page doesn't exist or was moved." | Go to dashboard |
| New company (FE-13) | Setup checklist + empty states, **never zeros or broken charts** | See `content.md` | Checklist steps |

## Implementation
```tsx
<AsyncSection
  query={query}                    // TanStack Query result
  skeleton={<TableSkeleton rows={8} />}
  empty={<EmptyState variant="filtered" … />}
  error={(e, retry) => <ErrorState scope="section" code={e.code} onRetry={retry} />}
>{data => <AttendanceTable data={data} />}</AsyncSection>
```
- `AsyncSection` delays the skeleton by 300 ms (`useDelayedFlag`).
- Skeleton blocks use `bg-muted` with radius matched to the real element. The shimmer is a 1.6 s linear sweep, removed under reduced motion. The container has `aria-busy="true"` and sr-only text "Loading {thing}" (announced once).
- Errors are scoped: a failed widget never blanks the page. A global error boundary only catches render crashes and shows a full-page error with "Reload".

## Copy
All empty/error copy is in `content.md`. Doodles: see `components/empty-state.md` (only the `first-use` and `caught-up` variants).

## Tokens
`--muted`, `--error`, `--error-bg`, `--brand` (first-use CTA only), `--elev-hard`, `--dur-*`.
