"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import {
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type SortingState,
  type Updater,
} from "@tanstack/react-table"

import { TableSkeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

// docs/design-system/components/table.md · server-side data: the API sorts and pages,
// the caller keeps sort/page state (in the URL) and passes one page of rows.
export const dataTableFeatures = tableFeatures({ rowSortingFeature })
type Features = typeof dataTableFeatures

export type DataTableColumn<T extends object> = ColumnDef<Features, T, any>
export type { SortingState }

/** Column meta: numbers, times and amounts align to the end and use tabular digits. */
export type DataTableColumnMeta = { align?: "start" | "end" }

export function createDataTableColumns<T extends object>() {
  return createColumnHelper<Features, T>()
}

type DataTableProps<T extends object> = {
  /** Visually hidden, read by screen readers. */
  caption: string
  columns: DataTableColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  loading?: boolean
  loadingLabel?: string
  /** A section ErrorState to show instead of rows. */
  error?: React.ReactNode
  /** An EmptyState to show when there are no rows. */
  empty?: React.ReactNode
  /** Usually <TablePagination>. */
  footer?: React.ReactNode
  /** Labels for the sort buttons' accessible names. */
  sortLabels?: { ascending: string; descending: string; none: string }
  className?: string
}

const EMPTY_ROWS: never[] = []

function alignOf(meta: unknown) {
  return (meta as DataTableColumnMeta | undefined)?.align === "end"
    ? "end"
    : "start"
}

function DataTable<T extends object>({
  caption,
  columns,
  data,
  getRowId,
  sorting,
  onSortingChange,
  loading = false,
  loadingLabel = "Loading",
  error,
  empty,
  footer,
  sortLabels = {
    ascending: "sorted ascending",
    descending: "sorted descending",
    none: "not sorted",
  },
  className,
}: DataTableProps<T>) {
  const onSorting = React.useCallback(
    (updater: Updater<SortingState>) =>
      onSortingChange(
        typeof updater === "function" ? updater(sorting) : updater
      ),
    [onSortingChange, sorting]
  )

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: data.length ? data : (EMPTY_ROWS as T[]),
    getRowId,
    state: { sorting },
    onSortingChange: onSorting,
    manualSorting: true,
    enableMultiSort: false,
  })

  const rows = table.getRowModel().rows
  const columnCount = columns.length
  let body: React.ReactNode
  if (error) {
    body = error
  } else if (loading) {
    body = <TableSkeleton columns={columnCount} label={loadingLabel} />
  } else if (rows.length === 0) {
    body = empty
  }

  return (
    <div
      data-slot="data-table"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="border-b">
              {group.headers.map((header) => {
                const align = alignOf(header.column.columnDef.meta)
                const sorted = header.column.getIsSorted()
                const canSort = header.column.getCanSort()
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      sorted === "asc"
                        ? "ascending"
                        : sorted === "desc"
                          ? "descending"
                          : undefined
                    }
                    className={cn(align === "end" && "text-end")}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid",
                          sorted && "font-bold text-foreground",
                          align === "end" && "flex-row-reverse"
                        )}
                      >
                        <table.FlexRender header={header} />
                        <span className="sr-only">
                          ,{" "}
                          {sorted === "asc"
                            ? sortLabels.ascending
                            : sorted === "desc"
                              ? sortLabels.descending
                              : sortLabels.none}
                        </span>
                        {sorted === "asc" ? (
                          <ArrowUpIcon aria-hidden className="size-3.5" />
                        ) : sorted === "desc" ? (
                          <ArrowDownIcon aria-hidden className="size-3.5" />
                        ) : (
                          <ArrowUpDownIcon
                            aria-hidden
                            className="size-3 text-muted-foreground"
                          />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        {body === undefined ? (
          <TableBody>
            {rows.map((row) => (
              // "group" lets row actions brighten on row hover (table.md).
              <TableRow key={row.id} className="group">
                {row.getAllCells().map((cell) => {
                  const align = alignOf(cell.column.columnDef.meta)
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(align === "end" && "tabular text-end")}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        ) : null}
      </Table>
      {body !== undefined ? (
        <div className="border-t border-border">{body}</div>
      ) : null}
      {footer}
    </div>
  )
}

export { DataTable, type DataTableProps }
