import { expect, type Page } from "@playwright/test"

// Demo accounts served by the mock API (mocks/data.ts).
export const DEMO_PASSWORD = "demo-password"
export const ADMIN = "admin@demo.stampd.app"
export const EMPLOYEE = "employee@demo.stampd.app"

/** Fills the login form on the current page and submits it. */
export async function submitLogin(
  page: Page,
  email: string,
  password = DEMO_PASSWORD
) {
  await page.getByLabel("Work email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Log in" }).click()
}

/** Signs in through the UI and waits for the destination page. */
export async function logIn(page: Page, email = ADMIN, path = "/en") {
  await page.goto(`/en/login?returnTo=${encodeURIComponent(path)}`)
  await submitLogin(page, email)
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[?]/g, "\\$&")}$`))
}
