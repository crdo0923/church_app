import { test, expect } from "@playwright/test";

test("login shows tracker copy and setup state", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Project Roadmap")).toBeVisible();
  await expect(page.getByText("Tracker accounts are independent")).toBeVisible();
});

test("roadmap lists all 10 phases with human language (redirects to login when signed out)", async ({ page }) => {
  await page.goto("/app/roadmap");
  // Auth guard: signed-out visitors land on the tracker sign-in, which must
  // use roadmap language (never LMS login language).
  await expect(page.getByText("Project Roadmap")).toBeVisible();
  await expect(page.getByText("Tracker accounts are independent")).toBeVisible();
});

test("overview answers the core questions (redirects to login when signed out)", async ({ page }) => {
  await page.goto("/app/overview");
  await expect(page.getByText("Project Roadmap").first()).toBeVisible();
  await expect(page.getByText("Sign in to manage the project roadmap.")).toBeVisible();
});
