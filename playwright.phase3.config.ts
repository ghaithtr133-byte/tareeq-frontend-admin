import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/phase3-e2e", fullyParallel: false, workers: 1, timeout: 60_000, reporter: "list",
  use: { baseURL: "http://127.0.0.1:3109", screenshot: "off", trace: "off" },
  webServer: { command: "node ./node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3109", url: "http://127.0.0.1:3109/admin/login", reuseExistingServer: false, timeout: 120_000,
    env: { ...process.env, ADMIN_DEV_MOCK_ACCESS: "disabled", NEXT_PUBLIC_API_BASE_URL: "/__dev_api", NEXT_TEST_DIST_DIR: ".next-phase3-e2e" },
  },
});
