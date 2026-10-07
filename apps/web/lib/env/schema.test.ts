import { describe, expect, it } from "vitest"

import { parseClientEnv, parseServerEnv } from "./schema"

describe("parseServerEnv", () => {
  it("accepts a valid environment", () => {
    expect(parseServerEnv({ API_BASE_URL: "http://localhost:4000" })).toEqual({
      API_BASE_URL: "http://localhost:4000",
      API_MOCKING: false,
    })
  })

  it("names every missing or invalid variable", () => {
    expect(() => parseServerEnv({ SENTRY_DSN: "not-a-url" })).toThrowError(
      /API_BASE_URL[\s\S]*SENTRY_DSN/
    )
  })

  it("treats empty strings as unset", () => {
    expect(
      parseServerEnv({
        API_BASE_URL: "https://api.example.com",
        SENTRY_DSN: "",
      })
    ).not.toHaveProperty("SENTRY_DSN")
  })
})

describe("parseClientEnv", () => {
  it("defaults the app environment to local", () => {
    expect(parseClientEnv({}).NEXT_PUBLIC_APP_ENV).toBe("local")
  })

  it("rejects an unknown app environment", () => {
    expect(() => parseClientEnv({ NEXT_PUBLIC_APP_ENV: "prod" })).toThrowError(
      /NEXT_PUBLIC_APP_ENV/
    )
  })
})
