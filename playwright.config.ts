import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* One worker: the tracker E2E drives a single embedded SQLite file and the
     first-admin setup race is inherently serial. */
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      TRACKER_DB_PATH: "/tmp/opencode/e2e-tracker.db",
      SUPER_ADMIN_BOOTSTRAP_PASSWORD: "460111",
    },
  },
});
