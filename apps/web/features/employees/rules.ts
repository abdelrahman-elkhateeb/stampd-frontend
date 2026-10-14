import { isPlainDate } from "@/lib/format"
import type { Role } from "@/lib/user"
import type { AccountStatus } from "@workspace/ui/components/status-chip"

import type { Department, Employee, LedgerEntry } from "./demo-data"

export type EmployeeQuery = {
  search: string
  departments: string[]
  statuses: AccountStatus[]
  /** "name", "-joinedOn"… (the API's sort convention). */
  sort: string
  page: number
  pageSize: number
}

// ponytail: filters, sorts and pages in the browser; GET /employees does this server-side (BE-06).
export function queryEmployees(
  employees: Employee[],
  departments: Department[],
  query: EmployeeQuery
) {
  const search = query.search.trim().toLowerCase()
  const departmentName = (employee: Employee) =>
    departments.find((department) => department.id === employee.departmentId)
      ?.name ?? ""
  const filtered = employees.filter(
    (employee) =>
      (!search ||
        [employee.name, employee.email, employee.code, employee.jobTitle].some(
          (value) => value.toLowerCase().includes(search)
        )) &&
      (query.departments.length === 0 ||
        query.departments.includes(employee.departmentId ?? "none")) &&
      (query.statuses.length === 0 || query.statuses.includes(employee.status))
  )
  const field = query.sort.replace(/^-/, "")
  const value = (employee: Employee) =>
    field === "department"
      ? departmentName(employee)
      : String(employee[field as keyof Employee] ?? "")
  const sorted = field
    ? [...filtered].sort(
        (a, b) =>
          value(a).localeCompare(value(b), undefined, { numeric: true }) *
          (query.sort.startsWith("-") ? -1 : 1)
      )
    : filtered
  const start = (query.page - 1) * query.pageSize
  return {
    rows: sorted.slice(start, start + query.pageSize),
    total: filtered.length,
  }
}

/** People who report to the employee and still have an account. */
export function directReports(employee: Employee, employees: Employee[]) {
  return employees.filter(
    (other) => other.managerId === employee.id && other.status !== "deactivated"
  )
}

/** Oldest first with the running balance (ledger-table.md). BE-08 returns these figures. */
export function ledgerRows(entries: LedgerEntry[]) {
  let balance = 0
  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      balance += entry.amount
      return { ...entry, balanceAfter: balance }
    })
  return { rows, available: balance }
}

// --- CSV import (stepper.md › CSV import steps) ---

export const IMPORT_COLUMNS = [
  "name",
  "email",
  "job_title",
  "department",
  "manager_email",
  "role",
  "joined_on",
] as const
export type ImportColumn = (typeof IMPORT_COLUMNS)[number]

export const IMPORT_MAX_ROWS = 1000
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024

export type ImportProblem =
  | "REQUIRED"
  | "INVALID_EMAIL"
  | "DUPLICATE_EMAIL"
  | "UNKNOWN_DEPARTMENT"
  | "UNKNOWN_MANAGER"
  | "INVALID_ROLE"
  | "INVALID_DATE"

export type ImportRow = {
  /** Line in the file, counting the header as 1. */
  line: number
  values: Record<ImportColumn, string>
  problems: { column: ImportColumn; code: ImportProblem }[]
}

const BOM = String.fromCharCode(0xfeff)

/** RFC 4180: commas, quoted fields, doubled quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  const source = text.replace(new RegExp(`^${BOM}`), "")
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else field += char
  }
  if (field !== "" || row.length) rows.push([...row, field])
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""))
}

/** UTF-8 BOM so Excel reads Arabic names (formatting.md › CSV). */
export function toCsv(rows: string[][]) {
  const cell = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  return `${BOM}${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES: Role[] = ["employee", "manager", "admin"]

export type ImportResult =
  | { ok: true; rows: ImportRow[] }
  | { ok: false; error: "EMPTY" | "WRONG_COLUMNS" | "TOO_MANY_ROWS" }

/** The checks BE-06 runs on upload, so the preview shows the same problems. */
export function validateImport(
  text: string,
  employees: Employee[],
  departments: Department[]
): ImportResult {
  const [header, ...lines] = parseCsv(text)
  if (!header || lines.length === 0) return { ok: false, error: "EMPTY" }
  const columns = header.map((name) => name.trim().toLowerCase())
  if (IMPORT_COLUMNS.some((column) => !columns.includes(column)))
    return { ok: false, error: "WRONG_COLUMNS" }
  if (lines.length > IMPORT_MAX_ROWS)
    return { ok: false, error: "TOO_MANY_ROWS" }

  const taken = new Set(employees.map((e) => e.email.toLowerCase()))
  const managers = new Set(
    employees
      .filter((e) => e.status !== "deactivated")
      .map((e) => e.email.toLowerCase())
  )
  const departmentNames = new Set(departments.map((d) => d.name.toLowerCase()))
  const seen = new Set<string>()

  const rows = lines.map((cells, index): ImportRow => {
    const values = Object.fromEntries(
      IMPORT_COLUMNS.map((column) => [
        column,
        (cells[columns.indexOf(column)] ?? "").trim(),
      ])
    ) as Record<ImportColumn, string>
    const problems: ImportRow["problems"] = []
    const add = (column: ImportColumn, code: ImportProblem) =>
      problems.push({ column, code })
    const email = values.email.toLowerCase()

    for (const column of ["name", "email", "job_title", "joined_on"] as const)
      if (!values[column]) add(column, "REQUIRED")
    if (email && !EMAIL.test(email)) add("email", "INVALID_EMAIL")
    else if (email && (taken.has(email) || seen.has(email)))
      add("email", "DUPLICATE_EMAIL")
    seen.add(email)
    if (
      values.department &&
      !departmentNames.has(values.department.toLowerCase())
    )
      add("department", "UNKNOWN_DEPARTMENT")
    if (
      values.manager_email &&
      !managers.has(values.manager_email.toLowerCase())
    )
      add("manager_email", "UNKNOWN_MANAGER")
    if (values.role && !ROLES.includes(values.role.toLowerCase() as Role))
      add("role", "INVALID_ROLE")
    if (values.joined_on && !isPlainDate(values.joined_on))
      add("joined_on", "INVALID_DATE")

    return { line: index + 2, values, problems }
  })
  return { ok: true, rows }
}
