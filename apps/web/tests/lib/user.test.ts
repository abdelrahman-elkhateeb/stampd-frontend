import { describe, expect, it } from "vitest"

import { toUser } from "@/lib/user"

describe("toUser", () => {
  it("maps the API's role and weekday codes to the app's", () => {
    const user = toUser({
      id: "u1",
      name: "Sara",
      email: "sara@demo.stampd.app",
      role: "ADMIN",
      company: {
        name: "Nakheel",
        timezone: "Asia/Riyadh",
        weekStart: "SUN",
        workingDays: ["SUN", "MON", "THU"],
      },
    })
    expect(user.role).toBe("admin")
    expect(user.company).toMatchObject({ weekStart: 0, workingDays: [0, 1, 4] })
  })
})
