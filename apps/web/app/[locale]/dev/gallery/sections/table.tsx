"use client"

import { useTranslations } from "next-intl"
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from "nuqs"
import { useMemo, useState } from "react"

import { Status } from "@/components/status"
import { useFormat } from "@/lib/use-format"
import { useTableLabels } from "@/lib/use-table-labels"
import { useTableUrlState } from "@/lib/use-table-url-state"
import { PersonAvatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  createDataTableColumns,
  DataTable,
  type DataTableColumn,
} from "@workspace/ui/components/data-table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { ErrorState } from "@workspace/ui/components/error-state"
import { FiltersBar, FilterTrigger } from "@workspace/ui/components/filters-bar"
import { TablePagination } from "@workspace/ui/components/pagination"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { Demo } from "../demo"

const STATUSES = ["present", "late", "absent", "wfh", "leave"] as const
type RowStatus = (typeof STATUSES)[number]
type Row = {
  id: string
  name: string
  department: string
  status: RowStatus
  joinedOn: string
  leaveDays: number
}

const NAMES = [
  "Sara Al-Harbi",
  "Omar Khalid",
  "Lina Haddad",
  "Fatima Al-Zahrani",
  "Khalid Noor",
  "Maha Saeed",
  "Yousef Hamdan",
  "Noura Al-Otaibi",
  "Ahmed Farouk",
  "Reem Al-Qahtani",
  "Faisal Al-Dosari",
  "Huda Mansour",
  "Tariq Al-Amri",
  "Layla Ibrahim",
  "Saeed Al-Mutairi",
  "Dana Al-Shehri",
  "Majed Al-Ghamdi",
  "Rana Hijazi",
  "Bader Al-Subaie",
  "Mona Al-Rashid",
  "Hassan Al-Zahrani",
  "Aisha Kareem",
  "Nasser Al-Harthi",
  "Salma Yasin",
  "Waleed Al-Anazi",
  "Hind Al-Saud",
  "Ziad Al-Malki",
  "Abeer Al-Juhani",
  "Rashed Al-Kaabi",
  "Jana Al-Yami",
]
const DEPARTMENTS = ["Operations", "Finance", "Sales", "People", "Engineering"]

const ROWS: Row[] = NAMES.map((name, index) => ({
  id: `e-${index + 1}`,
  name,
  department: DEPARTMENTS[index % DEPARTMENTS.length]!,
  status: STATUSES[(index * 7) % STATUSES.length]!,
  joinedOn: `202${2 + (index % 4)}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
  leaveDays: (index * 5) % 23,
}))

const STATUS_LABEL_KEYS = {
  present: "status.present",
  late: "status.late",
  absent: "status.absent",
  wfh: "status.wfh",
  leave: "status.onLeave",
} as const

// Status filters keep their status colours (filters-bar.md).
const STATUS_TONES = {
  present: "bg-status-present-bg text-status-present",
  late: "bg-status-late-bg text-status-late",
  absent: "bg-status-absent-bg text-status-absent",
  wfh: "bg-status-wfh-bg text-status-wfh",
  leave: "bg-status-leave-bg text-status-leave",
} as const

const columnHelper = createDataTableColumns<Row>()

export function TableSection() {
  const t = useTranslations()
  const format = useFormat()
  const labels = useTableLabels()
  const table = useTableUrlState({ defaultSort: "name", defaultSize: 10 })
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsArrayOf(parseAsStringLiteral(STATUSES)).withDefault([])
  )
  const [mode, setMode] = useState<"data" | "loading" | "empty" | "error">(
    "data"
  )

  const columns = useMemo<DataTableColumn<Row>[]>(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="flex items-center gap-2">
            <PersonAvatar
              name={info.getValue()}
              userId={info.row.original.id}
              size={24}
            />
            <bdi>{info.getValue()}</bdi>
          </span>
        ),
      }),
      columnHelper.accessor("department", { header: "Department" }),
      columnHelper.accessor("status", {
        header: "Today",
        enableSorting: false,
        cell: (info) => <Status status={info.getValue()} size="sm" />,
      }),
      columnHelper.accessor("joinedOn", {
        header: "Joined",
        cell: (info) => format.day(info.getValue(), "numeric"),
      }),
      columnHelper.accessor("leaveDays", {
        header: "Leave days",
        meta: { align: "end" },
        cell: (info) => format.number(info.getValue()),
      }),
    ],
    [format]
  )

  // The gallery fakes the server: filter, sort and page the static rows like the API would.
  const filtered = ROWS.filter(
    (row) =>
      (!table.search ||
        row.name.toLowerCase().includes(table.search.toLowerCase())) &&
      (statusFilter.length === 0 || statusFilter.includes(row.status))
  )
  const sortRule = table.sorting[0]
  const sorted = sortRule
    ? [...filtered].sort((a, b) => {
        const key = sortRule.id as keyof Row
        const result = String(a[key]).localeCompare(String(b[key]), undefined, {
          numeric: true,
        })
        return sortRule.desc ? -result : result
      })
    : filtered
  const pageRows = sorted.slice(
    (table.page - 1) * table.pageSize,
    table.page * table.pageSize
  )
  const rows = mode === "empty" ? [] : pageRows
  const filtersActive = Boolean(table.search) || statusFilter.length > 0

  const statusLabel = (status: RowStatus) => t(STATUS_LABEL_KEYS[status])

  return (
    <div className="flex flex-col gap-6">
      <Demo title="State">
        <ToggleGroup
          type="single"
          aria-label="Table state"
          value={mode}
          onValueChange={(value) => value && setMode(value as typeof mode)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="data">Data</ToggleGroupItem>
          <ToggleGroupItem value="loading">Loading</ToggleGroupItem>
          <ToggleGroupItem value="empty">Empty</ToggleGroupItem>
          <ToggleGroupItem value="error">Error</ToggleGroupItem>
        </ToggleGroup>
      </Demo>

      <FiltersBar
        label="Filter employees"
        search={{
          value: table.search,
          onChange: table.setSearch,
          placeholder: "Search by name",
          label: "Search employees",
        }}
        actions={
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
        }
        active={[
          ...(table.search
            ? [
                {
                  key: "q",
                  label: `“${table.search}”`,
                  removeLabel: t("filters.remove", { name: table.search }),
                  onRemove: () => table.setSearch(""),
                },
              ]
            : []),
          ...statusFilter.map((status) => ({
            key: status,
            label: statusLabel(status),
            removeLabel: t("filters.remove", { name: statusLabel(status) }),
            onRemove: () =>
              setStatusFilter(statusFilter.filter((item) => item !== status)),
            className: STATUS_TONES[status],
          })),
        ]}
        activeLabel={t("filters.active")}
        clearAllLabel={t("filters.clearAll")}
        onClearAll={() => {
          table.setSearch("")
          void setStatusFilter(null)
        }}
        resultText={
          filtersActive
            ? t("filters.results", { count: filtered.length })
            : undefined
        }
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterTrigger label="Status" count={statusFilter.length} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) =>
                  setStatusFilter(
                    checked
                      ? [...statusFilter, status]
                      : statusFilter.filter((item) => item !== status)
                  )
                }
                onSelect={(event) => event.preventDefault()}
              >
                {statusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </FiltersBar>

      <DataTable
        caption="Employees"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sorting={table.sorting}
        onSortingChange={table.setSorting}
        sortLabels={labels.sort}
        loading={mode === "loading"}
        loadingLabel={labels.loading("employees")}
        error={
          mode === "error" ? (
            <ErrorState
              title="Couldn't load employees"
              body="The rest of the page still works."
              code="req_7f3a91"
              actions={
                <Button variant="outline" size="sm">
                  {t("common.tryAgain")}
                </Button>
              }
            />
          ) : undefined
        }
        empty={
          filtersActive || mode === "empty" ? (
            <EmptyState
              variant="filtered"
              title="No employees match"
              body="Try a different name or remove a filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    table.setSearch("")
                    void setStatusFilter(null)
                    setMode("data")
                  }}
                >
                  {t("common.clearFilters")}
                </Button>
              }
            />
          ) : undefined
        }
        footer={
          mode === "data" ? (
            <TablePagination
              page={table.page}
              pageSize={table.pageSize}
              total={filtered.length}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              labels={labels.pagination}
              formatNumber={labels.formatNumber}
            />
          ) : undefined
        }
      />
    </div>
  )
}
