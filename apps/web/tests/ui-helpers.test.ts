import { describe, expect, it } from "vitest"

import { avatarTone, initials } from "@workspace/ui/components/avatar"
import { pageItems } from "@workspace/ui/components/pagination"

describe("initials", () => {
  it("takes the first letter of the first and last name", () => {
    expect(initials("Sara Al-Harbi")).toBe("SA")
    expect(initials("  fatima   al zahrani ")).toBe("FZ")
    expect(initials("Omar")).toBe("O")
  })

  it("separates Arabic initials with a thin space", () => {
    expect(initials("سارة عبدالله")).toBe("س\u2009ع")
  })
})

describe("avatarTone", () => {
  it("gives the same person the same colour", () => {
    expect(avatarTone("user-1")).toBe(avatarTone("user-1"))
    expect(avatarTone("user-1")).toMatch(/^bg-avatar-[1-6]$/)
  })
})

describe("pageItems", () => {
  it("shows first, last, current ±1 with gaps", () => {
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(1, 9)).toEqual([1, 2, "gap", 9])
    expect(pageItems(5, 9)).toEqual([1, "gap", 4, 5, 6, "gap", 9])
    expect(pageItems(9, 9)).toEqual([1, "gap", 8, 9])
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5])
  })
})
