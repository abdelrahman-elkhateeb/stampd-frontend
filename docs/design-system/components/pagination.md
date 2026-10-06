# Pagination

**Purpose.** Page through long tables and lists (FE-05, FE-08, FE-14, notifications).

**Anatomy.** Range text "1–25 of 204" (start) · rows-per-page select (10/25/50/100) · spacer · nav: Previous · page numbers with ellipsis · Next.

**Sizes / density.** Buttons and page numbers `size-control-xs` (32 / 28), round. Text `--fs-body-sm`. Footer height 52, top hairline.

**States.** Current page: `--primary` / `--primary-foreground`, 700, `aria-current="page"`. Hover: `--accent`. Prev/next disabled at the ends (`aria-disabled`, `--disabled-foreground`). Next uses the outline style.

**Behaviour.** Shows the first, last, current and ±1 pages, with ellipses between. Page and size are in the URL. Changing the page scrolls the table top into view and moves focus to the table caption. Mobile shows "Previous / Page 2 of 9 / Next" only.

**Accessibility.** `<nav aria-label="Pagination">`. Buttons: "Page 3", "Next page". The range text is a polite live region.

**RTL.** Previous/Next arrows flip, and the number order mirrors.

**shadcn base + props.** `pagination.tsx`.
```ts
interface TablePaginationProps { page: number; pageSize: 10 | 25 | 50 | 100; total: number; onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void; }
```

**Tokens.** `--primary*`, `--accent`, `--input`, `--disabled-foreground`, `--border`, `--control-h-xs`.
