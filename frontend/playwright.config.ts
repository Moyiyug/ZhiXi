import { defineConfig, devices } from "playwright/test"

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: "html",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "msedge" },
    },
  ],
  webServer: {
    command: `${npmCommand} run dev -- --host 127.0.0.1`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
})
