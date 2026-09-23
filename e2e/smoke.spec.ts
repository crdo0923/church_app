import { test, expect } from "@playwright/test";

test("overview renders command-center shell", async ({ page }) => {
  await page.goto("/app/overview");
  await expect(page.getByRole("heading", { name: "Church Leadership LMS" })).toBeVisible();
  await expect(page.getByText("Roadmap Snapshot")).toBeVisible();
  await expect(page.getByText("Architecture at a glance")).toBeVisible();
});

test("roadmap lists all 10 phases", async ({ page }) => {
  await page.goto("/app/roadmap");
  await expect(page.getByRole("heading", { name: "Technical Build Roadmap" })).toBeVisible();
  for (const n of ["01", "05", "10"]) {
    await expect(page.getByText(n, { exact: true }).first()).toBeVisible();
  }
});
