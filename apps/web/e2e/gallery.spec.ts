import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

// FE-01c: every shared component in light and dark, English and Arabic, passes WCAG AA
// (including colour contrast), works at 360px and is reachable by keyboard.

for (const locale of ["en", "ar"] as const) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`gallery passes axe WCAG AA · ${locale} · ${colorScheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" })
      await page.goto(`/${locale}/dev/gallery`)
      await expect(
        page.getByRole("heading", { level: 1, name: "Component gallery" })
      ).toBeVisible()
      await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme))
      // Skeletons fade in after 300 ms; let them settle before measuring contrast.
      await page.waitForTimeout(500)

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      const summary = results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
      }))
      expect(summary).toEqual([])
    })
  }
}

test("gallery has no horizontal scroll at 360px in either language", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const locale of ["en", "ar"]) {
    await page.goto(`/${locale}/dev/gallery`)
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
    expect(overflow, locale).toBeLessThanOrEqual(0)
  }
})

test("controls are keyboard-reachable with a visible focus ring", async ({
  page,
}) => {
  await page.goto("/en/dev/gallery")
  const approve = page.getByRole("button", { name: "Approve", exact: true })
  await approve.focus()
  await page.keyboard.press("Tab")
  await page.keyboard.press("Shift+Tab")
  await expect(approve).toBeFocused()
  const outline = await approve.evaluate(
    (element) => getComputedStyle(element).outlineStyle
  )
  expect(outline).not.toBe("none")
})

test("a disabled reason stays focusable and is announced", async ({ page }) => {
  await page.goto("/en/dev/gallery")
  const send = page.getByRole("button", { name: "Send invite" })
  await send.focus()
  await expect(send).toBeFocused()
  await expect(send).toHaveAttribute("aria-disabled", "true")
  await expect(page.getByRole("tooltip")).toHaveText(
    "Add at least one employee first"
  )
})

test("table state lives in the URL", async ({ page }) => {
  await page.goto("/en/dev/gallery?size=10")
  await page.getByRole("button", { name: /^Joined/ }).click()
  await expect(page).toHaveURL(/sort=joinedOn/)
  await page.getByRole("button", { name: "Next page" }).click()
  await expect(page).toHaveURL(/page=2/)

  await page.reload()
  await expect(page.getByText("11–20 of 30")).toBeVisible()
})

test("the drawer opens from the inline-end side", async ({ page }) => {
  for (const [locale, side] of [
    ["en", "right"],
    ["ar", "left"],
  ] as const) {
    await page.goto(`/${locale}/dev/gallery`)
    await page.getByRole("button", { name: "Open default drawer" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    const viewport = page.viewportSize()!
    // Poll: the panel slides in, so its position settles after the animation.
    await expect
      .poll(async () => {
        const box = (await dialog.boundingBox())!
        return side === "right"
          ? Math.round(box.x + box.width)
          : Math.round(box.x)
      })
      .toBe(side === "right" ? viewport.width : 0)
    await page.keyboard.press("Escape")
  }
})
