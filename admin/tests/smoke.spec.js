const { test, expect } = require("@playwright/test");

test("login page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("form.auth-card")).toBeVisible();
  await expect(page.locator("#tgId")).toBeVisible();
});
