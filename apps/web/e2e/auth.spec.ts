import { expect, test } from "@playwright/test"

import { ADMIN, EMPLOYEE, logIn, submitLogin } from "./helpers"

const PAGE = "/en/dev/api?tab=check"

test("signed-out users go to login and come back to the same page", async ({
  page,
}) => {
  await page.goto(PAGE)
  await expect(page).toHaveURL(
    /\/en\/login\?returnTo=%2Fen%2Fdev%2Fapi%3Ftab%3Dcheck$/
  )

  await submitLogin(page, ADMIN)
  await expect(page).toHaveURL(PAGE)
  await expect(page.getByTestId("user-name")).toHaveText("Sara Al-Harbi")
  await expect(page.getByTestId("client-user-name")).toHaveText("Sara Al-Harbi")
})

test("validation messages appear under their fields", async ({ page }) => {
  await page.goto("/en/login")
  await page.getByRole("button", { name: "Log in" }).click()

  const email = page.getByLabel("Work email")
  await expect(email).toHaveAttribute("aria-invalid", "true")
  await expect(email).toHaveAccessibleDescription("Fill in this field")
  await expect(email).toBeFocused()
})

test("wrong credentials show one generic message", async ({ page }) => {
  await page.goto("/en/login")
  await submitLogin(page, ADMIN, "not-the-password")
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Email or password is incorrect"
  )
})

test("API error codes are translated", async ({ page }) => {
  await page.goto("/ar/login")
  await page.locator("input[type=email]").fill("deactivated@demo.stampd.app")
  await page.locator("input[type=password]").fill("demo-password")
  await page.locator("button[type=submit]").click()
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "لم يعد حسابك نشطًا. تواصل مع المسؤول إذا كان هذا خطأ."
  )
})

test("a 403 shows the no-access page", async ({ page }) => {
  await logIn(page, EMPLOYEE)
  const response = await page.goto("/en/dev/api")
  expect(response?.status()).toBe(403)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "You don't have access"
  )
})

test("tokens live in httpOnly cookies only", async ({ page, context }) => {
  await logIn(page)
  expect(await page.evaluate(() => document.cookie)).not.toContain("stampd_")

  const cookies = await context.cookies()
  const session = cookies.filter((cookie) => cookie.name.startsWith("stampd_"))
  expect(session.map((cookie) => cookie.name).sort()).toEqual([
    "stampd_at",
    "stampd_rt",
  ])
  expect(session.every((cookie) => cookie.httpOnly)).toBe(true)
})

test("the browser can't reach the token endpoints through the BFF", async ({
  page,
}) => {
  await logIn(page)
  const status = await page.evaluate(async () => {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      body: "{}",
    })
    return response.status
  })
  expect(status).toBe(404)
})

test("an expired access token is refreshed silently", async ({
  page,
  context,
}) => {
  await logIn(page, ADMIN, "/en/dev/api")
  const before = (await context.cookies()).find(
    (cookie) => cookie.name === "stampd_rt"
  )?.value

  // The e2e mock issues 32 s tokens, so the access cookie is gone after ~2 s.
  await page.waitForTimeout(3_000)
  await page.reload()

  await expect(page).toHaveURL(/\/en\/dev\/api$/)
  await expect(page.getByTestId("user-name")).toHaveText("Sara Al-Harbi")
  const after = (await context.cookies()).find(
    (cookie) => cookie.name === "stampd_rt"
  )?.value
  expect(after).toBeTruthy()
  expect(after).not.toBe(before)
})

test("when the session can't be refreshed, login returns the user to the page", async ({
  page,
  context,
}) => {
  await logIn(page, ADMIN, "/en/dev/api")
  await context.clearCookies({ name: "stampd_at" })
  await context.addCookies([
    {
      name: "stampd_rt",
      value: "rt_revoked",
      url: "http://localhost:3100",
      httpOnly: true,
    },
  ])

  await page.goto(PAGE)
  await expect(page).toHaveURL(/\/en\/login\?.*reason=expired/)
  await expect(page.getByRole("status")).toContainText("Your session ended")

  await submitLogin(page, ADMIN)
  await expect(page).toHaveURL(PAGE)
})

test("a 401 on a browser request sends the user to login", async ({
  page,
  context,
}) => {
  await logIn(page, ADMIN, "/en/dev/api")
  await context.clearCookies()

  await page.getByRole("button", { name: "Refetch" }).click()
  await expect(page).toHaveURL(
    /\/en\/login\?returnTo=%2Fen%2Fdev%2Fapi&reason=expired$/
  )
})

test("log out ends the session", async ({ page }) => {
  await logIn(page)
  await page.getByRole("button", { name: "Log out" }).click()
  await expect(page).toHaveURL(/\/en\/login$/)

  await page.goto("/en")
  await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fen$/)
})
