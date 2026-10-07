import { afterEach, describe, expect, it, vi } from "vitest"

const env = vi.hoisted(() => ({ NEXT_PUBLIC_APP_ENV: "local" as string }))
vi.mock("@/lib/env/client", () => ({ clientEnv: env }))

const { devRoutesEnabled, isDevOnlyPath, isPublicPath } =
  await import("./routes")

afterEach(() => {
  env.NEXT_PUBLIC_APP_ENV = "local"
})

describe("dev routes (gallery, API check)", () => {
  it.each(["local", "preview", "staging"])("are on in %s", (appEnv) => {
    env.NEXT_PUBLIC_APP_ENV = appEnv
    expect(devRoutesEnabled()).toBe(true)
  })

  it("are off in production", () => {
    env.NEXT_PUBLIC_APP_ENV = "production"
    expect(devRoutesEnabled()).toBe(false)
  })

  it("match /dev and everything under it", () => {
    expect(isDevOnlyPath("/dev/gallery")).toBe(true)
    expect(isDevOnlyPath("/dev")).toBe(true)
    expect(isDevOnlyPath("/developers")).toBe(false)
  })
})

describe("public paths", () => {
  it("lets auth screens and the gallery through without a session", () => {
    expect(isPublicPath("/login")).toBe(true)
    expect(isPublicPath("/reset-password/abc")).toBe(true)
    expect(isPublicPath("/dev/gallery")).toBe(true)
  })

  it("protects everything else", () => {
    expect(isPublicPath("/")).toBe(false)
    expect(isPublicPath("/dev/api")).toBe(false)
    expect(isPublicPath("/login-help")).toBe(false)
  })
})
