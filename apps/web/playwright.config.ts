import { defineConfig, devices } from "@playwright/test"

const PORT = 3100
const MOCK_PORT = 4100
const baseURL = `http://localhost:${PORT}`

// Access tokens live 32 s in the e2e mock API, so the session cookie expires after
// ~2 s and the silent-refresh path runs during the tests.
const MOCK_ACCESS_TTL = 32

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // A production build against the mock API, like a preview deploy.
  webServer: [
    {
      command: "pnpm mock",
      url: `http://localhost:${MOCK_PORT}/health`,
      env: {
        API_BASE_URL: `http://localhost:${MOCK_PORT}`,
        MOCK_ACCESS_TTL: String(MOCK_ACCESS_TTL),
      },
      reuseExistingServer: false,
    },
    {
      command: `pnpm exec next start --port ${PORT}`,
      url: baseURL,
      env: {
        API_BASE_URL: `http://localhost:${MOCK_PORT}`,
        API_MOCKING: "true",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
})
