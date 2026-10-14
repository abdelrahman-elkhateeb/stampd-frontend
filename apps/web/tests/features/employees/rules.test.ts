import { describe, expect, it } from "vitest"

import { DEMO_DEPARTMENTS, DEMO_EMPLOYEES, type LedgerEntry } from "@/features/employees/demo-data"
import {
  directReports,
  ledgerRows,
  parseCsv,
  queryEmployees,
  toCsv,
  validateImport,
} from "@/features/employees/rules"

const QUERY = {
  search: "",
  departments: [],
  statuses: [],
  sort: "name",
  page: 1,
  pageSize: 10,
}

describe("queryEmployees", () => {
  it("pages and reports the filtered total", () => {
    const { rows, total } = queryEmployees(
      DEMO_EMPLOYEES,
      DEMO_DEPARTMENTS,
      QUERY
    )
    expect(rows).toHaveLength(10)
    expect(total).toBe(DEMO_EMPLOYEES.length)
    expect(rows[0]!.name <= rows[1]!.name).toBe(true)
  })

  it("filters by search, department and status together", () => {
    const { rows } = queryEmployees(DEMO_EMPLOYEES, DEMO_DEPARTMENTS, {
      ...QUERY,
      search: "haddad",
      departments: ["d-finance"],
      statuses: ["active"],
    })
    expect(rows.map((e) => e.name)).toEqual(["Omar Haddad"])
  })

  it("sorts descending with a '-' prefix", () => {
    const { rows } = queryEmployees(DEMO_EMPLOYEES, DEMO_DEPARTMENTS, {
      ...QUERY,
      sort: "-joinedOn",
      pageSize: 100,
    })
    expect(rows[0]!.joinedOn >= rows.at(-1)!.joinedOn).toBe(true)
  })
})

describe("directReports", () => {
  it("skips deactivated reports", () => {
    const lead = DEMO_EMPLOYEES[0]!
    const reports = directReports(lead, DEMO_EMPLOYEES)
    expect(reports.length).toBeGreaterThan(0)
    expect(reports.every((e) => e.status !== "deactivated")).toBe(true)
  })
})

describe("ledgerRows", () => {
  it("sorts oldest first and keeps a running balance", () => {
    const entry = (date: string, amount: number) =>
      ({ date, amount }) as LedgerEntry
    const { rows, available } = ledgerRows([
      entry("2026-03-01", -3),
      entry("2026-01-01", 21),
      entry("2026-05-01", 2),
    ])
    expect(rows.map((r) => r.balanceAfter)).toEqual([21, 18, 20])
    expect(available).toBe(20)
  })
})

describe("CSV", () => {
  it("round-trips quotes, commas and newlines", () => {
    const rows = [
      ["a,b", 'say "hi"', "line\nbreak"],
      ["سارة", "", "x"],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe("validateImport", () => {
  const header = "name,email,job_title,department,manager_email,role,joined_on"

  it("rejects files without the template columns", () => {
    expect(validateImport("name,email\nA,a@b.co", [], [])).toEqual({
      ok: false,
      error: "WRONG_COLUMNS",
    })
  })

  it("flags each bad cell and keeps good rows clean", () => {
    const result = validateImport(
      [
        header,
        "Mona Ali,mona@x.sa,Analyst,Finance,,employee,2026-05-01",
        ",mona@x.sa,Analyst,Nowhere,ghost@x.sa,boss,2026-13-01",
        `New Person,${DEMO_EMPLOYEES[0]!.email},Analyst,,,,2026-05-01`,
      ].join("\n"),
      DEMO_EMPLOYEES,
      DEMO_DEPARTMENTS
    )
    if (!result.ok) throw new Error(result.error)
    const [good, bad, taken] = result.rows
    expect(good!.problems).toEqual([])
    expect(bad!.line).toBe(3)
    expect(bad!.problems.map((p) => `${p.column}:${p.code}`)).toEqual([
      "name:REQUIRED",
      "email:DUPLICATE_EMAIL",
      "department:UNKNOWN_DEPARTMENT",
      "manager_email:UNKNOWN_MANAGER",
      "role:INVALID_ROLE",
      "joined_on:INVALID_DATE",
    ])
    expect(taken!.problems).toEqual([
      { column: "email", code: "DUPLICATE_EMAIL" },
    ])
  })
})
