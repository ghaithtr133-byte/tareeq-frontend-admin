import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!baseURL) {
  throw new Error("Set PLAYWRIGHT_BASE_URL to an explicitly started local test server, for example http://localhost:4000.");
}

const localServer = new URL(baseURL);
if (localServer.protocol !== "http:" || localServer.hostname !== "localhost") {
  throw new Error("PLAYWRIGHT_BASE_URL must be an explicit http://localhost:<port> URL.");
}

/**
 * Opt-in runner for a server the developer started themselves. It deliberately
 * has no webServer entry and never discovers or reuses an arbitrary process.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45_000,
  reporter: "list",
  use: {
    baseURL: localServer.origin,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
