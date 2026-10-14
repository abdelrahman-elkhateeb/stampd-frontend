export type LedgerEntryType =
  | "allowance"
  | "adjustment"
  | "reservation"
  | "release"
  | "deduction"
  | "restoration"

/** Oldest first with the running balance (ledger-table.md). */
export function ledgerRows<T extends { amount: number }>(entries: T[]) {
  let balance = 0
  const rows = entries.map((entry) => {
    balance += entry.amount
    return { ...entry, balanceAfter: balance }
  })
  return { rows, available: balance }
}

// --- CSV import (stepper.md › CSV import steps) ---

/** The API's columns (BE-06): any order, any case; the first three are required. */
export const IMPORT_COLUMNS = [
  "name",
  "email",
  "joiningDate",
  "jobTitle",
  "department",
  "managerEmail",
  "role",
  "employeeCode",
  "phone",
] as const
export const IMPORT_REQUIRED = ["name", "email", "joiningDate"] as const

export const IMPORT_MAX_ROWS = 1000
/** The API reads at most 1 MB. */
export const IMPORT_MAX_BYTES = 1024 * 1024

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

export type ImportCheck =
  | { ok: true; header: string[]; rows: string[][] }
  | { ok: false; error: "EMPTY" | "WRONG_COLUMNS" | "TOO_MANY_ROWS" }

/** What can be checked before upload: the file's shape. The API checks every row. */
export function checkImport(text: string): ImportCheck {
  const [header, ...rows] = parseCsv(text)
  if (!header || rows.length === 0) return { ok: false, error: "EMPTY" }
  const columns = header.map((name) => name.trim().toLowerCase())
  if (IMPORT_REQUIRED.some((column) => !columns.includes(column.toLowerCase())))
    return { ok: false, error: "WRONG_COLUMNS" }
  if (rows.length > IMPORT_MAX_ROWS)
    return { ok: false, error: "TOO_MANY_ROWS" }
  return { ok: true, header: header.map((name) => name.trim()), rows }
}
