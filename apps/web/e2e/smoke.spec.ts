import { expect, test } from "@playwright/test"

import { logIn } from "./helpers"

test.describe("locale routing", () => {
  test.use({ locale: "ar-SA" })

  test("an Arabic browser lands on /ar in RTL", async ({ page }) => {
    await page.goto("/")
    // Signed out, so /ar sends us on to the Arabic login page.
    await expect(page).toHaveURL(/\/ar\/login\?returnTo=%2Far$/)
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(page.locator("html")).toHaveAttribute("lang", "ar")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })
})

test.describe("default locale", () => {
  test.use({ locale: "fr-FR" })

  test("any other language falls back to English", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/en\/login/)
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
  })
})

test("switching language keeps the page and remembers the choice", async ({
  page,
}) => {
  await page.goto("/en/login")
  await page.getByRole("link", { name: "العربية" }).click()
  await expect(page).toHaveURL(/\/ar\/login/)

  await page.goto("/")
  await expect(page).toHaveURL(/\/ar\//)
})

test("an unknown URL shows the localised 404 page", async ({ page }) => {
  await logIn(page)
  const response = await page.goto("/ar/does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  await expect(
    page.getByRole("heading", { level: 1, name: "لم نعثر على هذه الصفحة" })
  ).toBeVisible()
})

test("nothing scrolls sideways at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await logIn(page)
  for (const path of [
    "/en",
    "/ar",
    "/ar/does-not-exist",
    "/en/login",
    "/ar/login",
  ]) {
    await page.goto(path)
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
