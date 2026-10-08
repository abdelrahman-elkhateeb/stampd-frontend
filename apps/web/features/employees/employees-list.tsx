"use client"

import {
  EllipsisVerticalIcon,
  EyeIcon,
  FileUpIcon,
  PencilIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import { useMemo, useState } from "react"

import { Status } from "@/components/status"
import { Link } from "@/i18n/navigation"
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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { FiltersBar, FilterTrigger } from "@workspace/ui/components/filters-bar"
import { TablePagination } from "@workspace/ui/components/pagination"
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "@workspace/ui/components/status-chip"

import type { Employee } from "./demo-data"
import { EmployeeDrawer } from "./employee-drawer"
import { queryEmployees } from "./rules"
import { useEmployeesStore } from "./store"

// Status filters keep their status colours (filters-bar.md).
const STATUS_TONES: Record<AccountStatus, string> = {
  invited: "bg-info-bg text-info",
  active: "bg-success-bg text-success",
  deactivated: "bg-status-cancelled-bg text-status-cancelled",
}

const columnHelper = createDataTableColumns<Employee>()

export function EmployeesList() {
  const t = useTranslations("employees")
  const tAll = useTranslations()
  const format = useFormat()
  const labels = useTableLabels()
  const { employees, departments } = useEmployeesStore()
  const table = useTableUrlState({ defaultSort: "name" })
  const [filters, setFilters] = useQueryStates(
    {
      dept: parseAsArrayOf(parseAsString).withDefault([]),
      status: parseAsArrayOf(
        parseAsStringLiteral(ACCOUNT_STATUSES)
      ).withDefault([]),
    },
    { history: "replace", clearOnDefault: true }
  )
  const [editing, setEditing] = useState<Employee | "new" | null>(null)

  const departmentOptions = [
    ...departments.map((department) => ({
      id: department.id,
      label: department.name,
    })),
    { id: "none", label: t("noDepartment") },
  ]
  const statusLabel = (status: AccountStatus) => tAll(`account.${status}`)

  const { rows, total } = queryEmployees(employees, departments, {
    search: table.search,
    departments: filters.dept,
    statuses: filters.status,
    sort: table.sort,
    page: table.page,
    pageSize: table.pageSize,
  })
  const filtersActive =
    Boolean(table.search) ||
    filters.dept.length > 0 ||
    filters.status.length > 0

  function clearAll() {
    table.setSearch("")
    void setFilters({ dept: null, status: null })
  }

  function toggle(key: "dept" | "status", value: string, on: boolean) {
    const current: string[] = filters[key]
    void setFilters({
      [key]: on
        ? [...current, value]
        : current.filter((item) => item !== value),
    })
    table.setPage(1)
  }

  const columns = useMemo<DataTableColumn<Employee>[]>(() => {
    const nameOf = (list: { id: string; name: string }[], id: string | null) =>
      list.find((item) => item.id === id)?.name
    return [
      columnHelper.accessor("name", {
        header: t("columns.name"),
        cell: (info) => {
          const employee = info.row.original
          return (
            <span className="flex min-w-48 items-center gap-2">
              <PersonAvatar
                name={employee.name}
                userId={employee.id}
                size={24}
              />
              <span className="flex min-w-0 flex-col">
                <Link
                  href={`/employees/${employee.id}`}
                  className="truncate font-semibold underline-offset-4 hover:underline"
                >
                  <bdi>{employee.name}</bdi>
                </Link>
                <span className="truncate text-caption text-muted-foreground">
                  <bdi>{employee.jobTitle}</bdi>
                </span>
              </span>
            </span>
          )
        },
      }),
      columnHelper.accessor("departmentId", {
        id: "department",
        header: t("columns.department"),
        cell: (info) => cellText(nameOf(departments, info.getValue())),
      }),
      columnHelper.accessor("managerId", {
        id: "manager",
        header: t("columns.manager"),
        enableSorting: false,
        cell: (info) => cellText(nameOf(employees, info.getValue())),
      }),
      columnHelper.accessor("status", {
        header: t("columns.status"),
        cell: (info) => <Status status={info.getValue()} size="sm" />,
      }),
      columnHelper.accessor("joinedOn", {
        header: t("columns.joined"),
        cell: (info) => (
          <span className="tabular whitespace-nowrap">
            {format.day(info.getValue(), "numeric")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">{t("columns.actions")}</span>,
        cell: (info) => {
          const employee = info.row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("actionsFor", { name: employee.name })}
                  className="opacity-40 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100"
                >
                  <EllipsisVerticalIcon aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/employees/${employee.id}`}>
                    <EyeIcon aria-hidden />
                    {t("view")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setEditing(employee)}>
                  <PencilIcon aria-hidden />
                  {t("edit")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      }),
    ]
  }, [t, format, employees, departments])

  return (
    <div className="flex flex-col gap-4">
      <FiltersBar
        label={t("filterLabel")}
        search={{
          value: table.search,
          onChange: table.setSearch,
          placeholder: t("searchPlaceholder"),
          label: t("searchLabel"),
        }}
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/employees/import">
                <FileUpIcon aria-hidden />
                {t("importCsv")}
              </Link>
            </Button>
            <Button size="sm" onClick={() => setEditing("new")}>
              <PlusIcon aria-hidden />
              {t("add")}
            </Button>
          </>
        }
        active={[
          ...(table.search
            ? [
                {
                  key: "q",
                  label: `“${table.search}”`,
                  removeLabel: tAll("filters.remove", { name: table.search }),
                  onRemove: () => table.setSearch(""),
                },
              ]
            : []),
          ...filters.dept.map((id) => {
            const label =
              departmentOptions.find((option) => option.id === id)?.label ?? id
            return {
              key: `dept-${id}`,
              label,
              removeLabel: tAll("filters.remove", { name: label }),
              onRemove: () => toggle("dept", id, false),
            }
          }),
          ...filters.status.map((status) => ({
            key: status,
            label: statusLabel(status),
            removeLabel: tAll("filters.remove", { name: statusLabel(status) }),
            onRemove: () => toggle("status", status, false),
            className: STATUS_TONES[status],
          })),
        ]}
        activeLabel={tAll("filters.active")}
        clearAllLabel={tAll("filters.clearAll")}
        onClearAll={clearAll}
        resultText={
          filtersActive ? tAll("filters.results", { count: total }) : undefined
        }
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterTrigger
              label={t("columns.department")}
              count={filters.dept.length}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {departmentOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={filters.dept.includes(option.id)}
                onCheckedChange={(on) => toggle("dept", option.id, on)}
                onSelect={(event) => event.preventDefault()}
              >
                <bdi>{option.label}</bdi>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <FilterTrigger
              label={t("columns.status")}
              count={filters.status.length}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ACCOUNT_STATUSES.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.status.includes(status)}
                onCheckedChange={(on) => toggle("status", status, on)}
                onSelect={(event) => event.preventDefault()}
              >
                {statusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </FiltersBar>

      <DataTable
        caption={t("caption")}
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sorting={table.sorting}
        onSortingChange={table.setSorting}
        sortLabels={labels.sort}
        empty={
          filtersActive ? (
            <EmptyState
              variant="filtered"
              title={t("empty.filteredTitle")}
              body={t("empty.filteredBody")}
              action={
                <Button variant="outline" size="sm" onClick={clearAll}>
                  {tAll("common.clearFilters")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UsersIcon}
              title={t("empty.title")}
              body={t("empty.body")}
            />
          )
        }
        footer={
          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={total}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            labels={labels.pagination}
            formatNumber={labels.formatNumber}
          />
        }
      />

      <EmployeeDrawer
        key={
          editing === null ? "closed" : editing === "new" ? "new" : editing.id
        }
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

/** Empty cells show "–" with "No data" for screen readers (table.md). */
export function cellText(value: string | undefined) {
  return value ? <bdi className="whitespace-nowrap">{value}</bdi> : <NoData />
}

export function NoData() {
  const t = useTranslations("employees")
  return (
    <>
      <span aria-hidden>–</span>
      <span className="sr-only">{t("noData")}</span>
    </>
  )
}
