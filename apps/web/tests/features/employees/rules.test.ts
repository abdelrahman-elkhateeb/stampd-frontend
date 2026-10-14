import { describe, expect, it } from "vitest"

import {
  checkImport,
  ledgerRows,
  parseCsv,
  toCsv,
} from "@/features/employees/rules"

describe("ledgerRows", () => {
  it("keeps the order and adds the running balance", () => {
    const { rows, available } = ledgerRows([
      { amount: 21 },
      { amount: -3 },
      { amount: 3 },
      { amount: -2.5 },
    ])
    expect(rows.map((row) => row.balanceAfter)).toEqual([21, 18, 21, 18.5])
    expect(available).toBe(18.5)
  })
})

describe("CSV", () => {
  it("round-trips quotes, commas and Arabic", () => {
    const rows = [
      ["name", "note"],
      ["سارة الحربي", 'said "hi", left'],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe("checkImport", () => {
  it("needs the required columns in any case and order", () => {
    const ok = checkImport("Email,NAME,joiningdate\na@b.co,A,2026-01-01\n")
    expect(ok).toMatchObject({
      ok: true,
      rows: [["a@b.co", "A", "2026-01-01"]],
    })
    expect(checkImport("name,email\nA,a@b.co\n")).toEqual({
      ok: false,
      error: "WRONG_COLUMNS",
    })
    expect(checkImport("name,email,joiningDate\n")).toEqual({
      ok: false,
      error: "EMPTY",
    })
  })
})
