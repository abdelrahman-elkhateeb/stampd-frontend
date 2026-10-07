"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

// docs/design-system/components/pagination.md
export const PAGE_SIZES = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export type TablePaginationLabels = {
  nav: string
  previous: string
  next: string
  page: (page: number) => string
  /** "1–25 of 204" — format numbers with the user's locale. */
  range: (from: number, to: number, total: number) => string
  /** Mobile summary: "Page 2 of 9". */
  pageOf: (page: number, pageCount: number) => string
  rowsPerPage: string
}

const DEFAULT_LABELS: TablePaginationLabels = {
  nav: "Pagination",
  previous: "Previous page",
  next: "Next page",
  page: (page) => `Page ${page}`,
  range: (from, to, total) => `${from}–${to} of ${total}`,
  pageOf: (page, count) => `Page ${page} of ${count}`,
  rowsPerPage: "Rows per page",
}

/** First, last, current ±1, with "…" gaps. */
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set(
    [1, pageCount, page - 1, page, page + 1].filter(
      (p) => p >= 1 && p <= pageCount
    )
  )
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, index) =>
    index > 0 && p - sorted[index - 1]! > 1 ? ["gap" as const, p] : [p]
  )
}

function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  labels: labelsOverride,
  formatNumber = String,
  className,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
  labels?: Partial<TablePaginationLabels>
  formatNumber?: (value: number) => string
  className?: string
}) {
  const labels = { ...DEFAULT_LABELS, ...labelsOverride }
  const pageCount = Math.max(Math.ceil(total / pageSize), 1)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const atStart = page <= 1
  const atEnd = page >= pageCount
  const sizeId = React.useId()

  return (
    <div
      className={cn(
        "flex min-h-13 flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-cell py-2 text-body-sm",
        className
      )}
    >
      <p aria-live="polite" className="tabular text-muted-foreground">
        {labels.range(from, to, total)}
      </p>
      <div className="hidden items-center gap-2 sm:flex">
        <span id={sizeId} className="text-muted-foreground">
          {labels.rowsPerPage}
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value) as PageSize)}
        >
          <SelectTrigger size="sm" aria-labelledby={sizeId} className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {formatNumber(size)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <nav aria-label={labels.nav} className="ms-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={labels.previous}
          aria-disabled={atStart || undefined}
          onClick={() => !atStart && onPageChange(page - 1)}
          className="aria-disabled:bg-transparent"
        >
          <ChevronLeftIcon aria-hidden className="flip-rtl" />
        </Button>
        <span className="tabular px-2 sm:hidden">
          {labels.pageOf(page, pageCount)}
        </span>
        <ol className="hidden items-center gap-1 sm:flex">
          {pageItems(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <li
                key={`gap-${index}`}
                aria-hidden
                className="px-1 text-muted-foreground"
              >
                …
              </li>
            ) : (
              <li key={item}>
                <Button
                  variant={item === page ? "default" : "ghost"}
                  size="icon-xs"
                  aria-label={labels.page(item)}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => item !== page && onPageChange(item)}
                  className={cn("tabular", item === page && "font-bold")}
                >
                  {formatNumber(item)}
                </Button>
              </li>
            )
          )}
        </ol>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label={labels.next}
          aria-disabled={atEnd || undefined}
          onClick={() => !atEnd && onPageChange(page + 1)}
        >
          <ChevronRightIcon aria-hidden className="flip-rtl" />
        </Button>
      </nav>
    </div>
  )
}

export { TablePagination }
