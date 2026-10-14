import { expect, test } from "@playwright/test"

test.describe("locale routing", () => {
  test.use({ locale: "ar-SA" })

  test("an Arabic browser lands on /ar in RTL", async ({ page }) => {
    // Signed out, so "/" ends on the login page.
    await page.goto("/")
    await expect(page).toHaveURL(/\/ar\/login/)
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
  await expect(page).toHaveURL(/\/ar\/login/)
})

test("an unknown URL shows the localised 404 page", async ({ page }) => {
  // Under /dev, which is open without a session; elsewhere signed-out visitors go to login.
  const response = await page.goto("/ar/dev/does-not-exist")
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
    "/ar/dev/does-not-exist",
    "/en/login",
    "/ar/login",
    "/ar/signup",
    "/ar/forgot-password",
    "/ar/reset-password/demo-token",
    "/ar/invite/demo-token",
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

// Logging in needs stampd-backend, which CI doesn't run; this covers the guard and the form.
test("a signed-out visitor goes to login and the form validates", async ({
  page,
}) => {
  await page.goto("/en/attendance")
  await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fattendance$/)
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByText("Fill in this field")).toHaveCount(2)
})
