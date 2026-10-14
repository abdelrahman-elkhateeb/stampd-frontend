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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { FiltersBar, FilterTrigger } from "@workspace/ui/components/filters-bar"
import { TablePagination } from "@workspace/ui/components/pagination"
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "@workspace/ui/components/status-chip"

import type { Department, Employee, PersonOption } from "./employee-data"
import { EmployeeDrawer } from "./employee-drawer"

// Status filters keep their status colours (filters-bar.md).
const STATUS_TONES: Record<AccountStatus, string> = {
  invited: "bg-info-bg text-info",
  active: "bg-success-bg text-success",
  deactivated: "bg-status-cancelled-bg text-status-cancelled",
}

const columnHelper = createDataTableColumns<Employee>()

/** The server searches, filters, sorts and pages (GET /employees); the URL holds the query. */
export function EmployeesList({
  rows,
  total,
  departments,
  managers,
}: {
  rows: Employee[]
  total: number
  departments: Department[]
  managers: PersonOption[]
}) {
  const t = useTranslations("employees")
  const tAll = useTranslations()
  const format = useFormat()
  const labels = useTableLabels()
  const table = useTableUrlState({ defaultSort: "name", shallow: false })
  const [filters, setFilters] = useQueryStates(
    {
      dept: parseAsString,
      status: parseAsArrayOf(
        parseAsStringLiteral(ACCOUNT_STATUSES)
      ).withDefault([]),
    },
    { history: "replace", clearOnDefault: true, shallow: false }
  )
  const [editing, setEditing] = useState<Employee | "new" | null>(null)

  const statusLabel = (status: AccountStatus) => tAll(`account.${status}`)
  const departmentName = departments.find(
    (department) => department.id === filters.dept
  )?.name
  const filtersActive =
    Boolean(table.search) || Boolean(filters.dept) || filters.status.length > 0

  function clearAll() {
    table.setSearch("")
    void setFilters({ dept: null, status: null })
  }

  // The API filters by one department at a time.
  function setDepartment(id: string | null) {
    void setFilters({ dept: id })
    table.setPage(1)
  }

  function toggleStatus(status: AccountStatus, on: boolean) {
    void setFilters({
      status: on
        ? [...filters.status, status]
        : filters.status.filter((item) => item !== status),
    })
    table.setPage(1)
  }

  const columns = useMemo<DataTableColumn<Employee>[]>(() => {
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
      columnHelper.accessor((row) => row.department?.name, {
        id: "department",
        header: t("columns.department"),
        enableSorting: false,
        cell: (info) => cellText(info.getValue()),
      }),
      columnHelper.accessor((row) => row.manager?.name, {
        id: "manager",
        header: t("columns.manager"),
        enableSorting: false,
        cell: (info) => cellText(info.getValue()),
      }),
      columnHelper.accessor("status", {
        header: t("columns.status"),
        enableSorting: false,
        cell: (info) => <Status status={info.getValue()} size="sm" />,
      }),
      columnHelper.accessor("joinedOn", {
        // The API sorts by joiningDate.
        id: "joiningDate",
        header: t("columns.joined"),
        cell: (info) => {
          const day = info.getValue()
          return day ? (
            <span className="tabular whitespace-nowrap">
              {format.day(day, "numeric")}
            </span>
          ) : (
            <NoData />
          )
        },
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
  }, [t, format])

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
          ...(filters.dept
            ? [
                {
                  key: "dept",
                  label: departmentName ?? filters.dept,
                  removeLabel: tAll("filters.remove", {
                    name: departmentName ?? filters.dept,
                  }),
                  onRemove: () => setDepartment(null),
                },
              ]
            : []),
          ...filters.status.map((status) => ({
            key: status,
            label: statusLabel(status),
            removeLabel: tAll("filters.remove", { name: statusLabel(status) }),
            onRemove: () => toggleStatus(status, false),
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
              count={filters.dept ? 1 : 0}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={filters.dept ?? ""}
              onValueChange={(id) => setDepartment(id || null)}
            >
              {departments.map((department) => (
                <DropdownMenuRadioItem
                  key={department.id}
                  value={department.id}
                >
                  <bdi>{department.name}</bdi>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
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
                onCheckedChange={(on) => toggleStatus(status, on)}
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
        departments={departments}
        managers={managers}
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
