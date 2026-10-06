# Table

**Purpose.** Dense, scannable lists: attendance day view (FE-11), employees (FE-05), approvals (desktop), reports (FE-14), ledger (FE-07), chart fallbacks.

**Anatomy.** Card container · optional caption/toolbar · header row (`--muted`, `--fs-caption` 600) · body rows (hairline separators, **no zebra, no outlined rows**) · optional totals row (FE-14, 700, top border `--border-strong`) · footer with Pagination. Optional selection column and row-actions column.

**Variants.** `default` · `selectable` (checkbox column + ink selection bar) · `report` (sticky header, totals row, horizontal scroll, sticky first column) · `mobile-list` (below `md` rows become stacked list items: avatar, name, status chip, meta line).

**Sizes / density.** Row height `h-row` (56 comfortable / 40 compact; HR is compact). Cell padding `px-cell` (16 / 12). Cell text `text-cell` (14 / 13). Header height = row height. Numbers and times are tabular and `text-end`; text is `text-start`.

**States**
| State | Style |
|---|---|
| row hover | `--accent` |
| row selected | `--brand-subtle` + checked box, `aria-selected="true"` |
| row focus (keyboard) | 2px inset `--ring` |
| row actions | kebab icon button at 40% opacity, 100% on row hover/focus (always reachable by touch) |
| sorted column | header text 700 + `ArrowUp`/`ArrowDown` 14px; sortable-inactive = muted `ArrowUpDown` 12px |
| loading | skeleton rows (8) after 300 ms |
| empty | filtered / first-use empty state inside the card |
| error | section error inside the card |

**Behaviour.** Sorting cycles asc → desc → none. Sort, filter and page state live in the URL (FE-14). Empty cells show "–" with sr-only "No data". Long text truncates with an ellipsis + title. Selection: the ink bar shows "{n} selected" + bulk actions (Approve n, Add correction, Send reminder) + Clear. Rows open on Enter/click when they have a detail view.

**Accessibility.** A real `<table>` with `<caption class="sr-only">`, `<th scope="col">`, and `aria-sort` on sorted headers. Sort controls are `<button>`s inside `<th>`. Row actions trigger: "Actions for {name}". The selection count is announced politely.

**RTL.** Columns mirror (first column on the right). Numeric alignment stays `text-end` (left in RTL). The sticky first column uses `inset-inline-start`.

**Do / Don't.** ✅ Hairlines only. ✅ Status chips `sm` in cells. ❌ Zebra striping, vertical borders, or more than one row-actions trigger per row.

**shadcn base + props.** `table.tsx` + TanStack Table v8.
```ts
interface DataTableProps<T> {
  caption: string;
  columns: ColumnDef<T>[];      // meta: { align?: 'start' | 'end'; numeric?: boolean; sticky?: boolean }
  data: T[];
  state: { sorting: SortingState; pagination: PaginationState; rowSelection?: RowSelectionState };
  onStateChange: (s: Partial<DataTableProps<T>['state']>) => void;   // sync to URL
  rowActions?: (row: T) => { label: string; icon: LucideIcon; onSelect: () => void; destructive?: boolean }[];
  bulkActions?: (rows: T[]) => React.ReactNode;
  totalsRow?: Partial<Record<keyof T, React.ReactNode>>;
  loading?: boolean; error?: unknown; empty?: React.ReactNode;
  variant?: 'default' | 'report';
}
```

**Tokens.** `--card`, `--border`, `--muted`, `--subtle-foreground`, `--accent`, `--brand-subtle`, `--ring`, `--inverse*` (selection bar), `--row-h`, `--cell-px`, `--fs-cell`, `--radius-lg`.
