import { expect, test } from "@playwright/test"

test.describe("locale routing", () => {
  test.use({ locale: "ar-SA" })

  test("an Arabic browser lands on /ar in RTL", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/ar$/)
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
    await expect(page.locator("html")).toHaveAttribute("lang", "ar")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })
})

test.describe("default locale", () => {
  test.use({ locale: "fr-FR" })

  test("any other language falls back to English", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/en$/)
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
  await expect(page).toHaveURL(/\/ar$/)
})

test("an unknown URL shows the localised 404 page", async ({ page }) => {
  const response = await page.goto("/ar/does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  await expect(
    page.getByRole("heading", { level: 1, name: "لم نعثر على هذه الصفحة" })
  ).toBeVisible()
})

test("nothing scrolls sideways at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
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

test("a valid login form opens the app", async ({ page }) => {
  await page.goto("/en/login")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Fill in this field")).toHaveCount(2)

  await page.getByLabel("Work email").fill("sara@demo.stampd.app")
  await page.getByLabel("Password").fill("anything")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL(/\/en$/)
})
