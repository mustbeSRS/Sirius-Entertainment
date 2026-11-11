import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90000,
  workers: 1,
  globalSetup: "./tests/e2e/setup.ts",
  use: {
    actionTimeout: 15000,
    trace: "retain-on-failure",
    baseURL: "http://localhost:3000",
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command:
      "ADMIN_EMAILS=admin@example.com LOCAL_DEMO=true LOCAL_DATA_DIR=.data/e2e APP_ORIGIN=http://localhost:3000 npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
