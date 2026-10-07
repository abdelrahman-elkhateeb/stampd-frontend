import { faker } from "@faker-js/faker"

import type { CurrentUser, Employee } from "@/api/generated/model"

// Same data on every run, so screenshots and e2e tests are stable.
faker.seed(20261007)

export const DEMO_PASSWORD = "demo-password"

type DemoAccount = { user: CurrentUser; active: boolean }

const company = {
  id: "6f1c1d1e-3c55-4f0a-9b8e-6a2f6c7d8e90",
  name: "Demo Trading Co.",
  timezone: "Asia/Riyadh",
  weekStart: "SUN",
} as const

/** Sign in to the mock API with any of these emails and DEMO_PASSWORD. */
export const accounts: Record<string, DemoAccount> = {
  "admin@demo.stampd.app": {
    active: true,
    user: {
      id: "0b6c2f0e-8d7a-4a51-9a0e-2a4f7b8c9d10",
      name: "Sara Al-Harbi",
      email: "admin@demo.stampd.app",
      role: "ADMIN",
      locale: "en",
      company,
    },
  },
  "manager@demo.stampd.app": {
    active: true,
    user: {
      id: "5a0d7c4b-1e2f-4a3b-8c9d-0e1f2a3b4c5d",
      name: "Omar Khalid",
      email: "manager@demo.stampd.app",
      role: "MANAGER",
      locale: "ar",
      company,
    },
  },
  "employee@demo.stampd.app": {
    active: true,
    user: {
      id: "9c8b7a6d-5e4f-4321-9abc-def012345678",
      name: "Lina Haddad",
      email: "employee@demo.stampd.app",
      role: "EMPLOYEE",
      locale: "en",
      company,
    },
  },
  "deactivated@demo.stampd.app": {
    active: false,
    user: {
      id: "1d2c3b4a-5f6e-4d7c-8b9a-0f1e2d3c4b5a",
      name: "Former Employee",
      email: "deactivated@demo.stampd.app",
      role: "EMPLOYEE",
      locale: "en",
      company,
    },
  },
}

const DEPARTMENTS = ["Operations", "Finance", "Sales", "People", "Engineering"]
const STATUSES = [
  "ACTIVE",
  "ACTIVE",
  "ACTIVE",
  "INVITED",
  "DEACTIVATED",
] as const

export const employees: Employee[] = Array.from({ length: 57 }, () => {
  const name = faker.person.fullName()
  return {
    id: faker.string.uuid(),
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@demo.stampd.app`,
    department: faker.helpers.arrayElement(DEPARTMENTS),
    status: faker.helpers.arrayElement(STATUSES),
    joinedOn: faker.date
      .between({ from: "2022-01-01", to: "2026-09-30" })
      .toISOString()
      .slice(0, 10),
  }
})
