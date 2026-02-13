import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(SCRIPT_DIR, "..");
const PORT = Number(process.env.PORT || 3102);
const EXTERNAL_BASE = process.env.BASE_URL?.trim();
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;

const routes = [
  "/",
  "/guest-landing",
  "/browse",
  "/guest/browse",
  "/guest/login",
  "/guest/register",
  "/guest/help",
  "/guest/favorites",
  "/guest/history",
  "/guest/messages",
  "/guest/notifications",
  "/guest/profile",
  "/guest/bookings",
  "/guest/preview/demo",
  "/realtor/login",
  "/dashboard",
  "/bookings",
  "/properties",
  "/messages",
  "/notifications",
  "/verify-booking",
  "/admin/login",
  "/admin/settings",
];

const ERROR_PATTERNS =
  /Application error|client-side exception|TypeError|ReferenceError|Unhandled Runtime Error|ChunkLoadError/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function canReachBase(url, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.status >= 200 && response.status < 600;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer(timeoutMs = 90000) {
  if (EXTERNAL_BASE) return;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await canReachBase(BASE, 2500)) return;
    await sleep(700);
  }
  throw new Error(`Server timeout for ${BASE}`);
}

function startServer() {
  if (EXTERNAL_BASE) return null;
  const child = spawn(`npm run start -- -p ${PORT}`, [], {
    cwd: FRONTEND_ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });
  child.stdout.on("data", (d) => process.stdout.write(`[start] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[start:err] ${d}`));
  return child;
}

async function ensureServer() {
  if (EXTERNAL_BASE) return null;
  const alreadyRunning = await canReachBase(BASE);
  if (alreadyRunning) {
    console.log(`[audit] Reusing existing server: ${BASE}`);
    return null;
  }
  const server = startServer();
  await waitForServer();
  return server;
}

async function stopServer(server) {
  if (!server || server.killed) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    sleep(5000).then(() => {
      if (!server.killed) server.kill("SIGKILL");
    }),
  ]);
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    console.warn(
      "[audit] Bundled Playwright Chromium unavailable, trying installed Edge:",
      error instanceof Error ? error.message : String(error)
    );
  }

  try {
    return await chromium.launch({ headless: true, channel: "msedge" });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to launch a browser for audit. Run "npx playwright install chromium" or install Microsoft Edge. ${details}`
    );
  }
}

async function run() {
  const server = await ensureServer();
  try {
    console.log(`[audit] Base URL: ${BASE}`);
    const browser = await launchBrowser();
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const failures = [];

    for (const route of routes) {
      console.log(`\n>> checking ${route}`);
      const page = await context.newPage();
      const pageErrors = [];
      const consoleErrors = [];
      const onPageError = (err) => pageErrors.push(String(err?.stack || err?.message || err));
      const onConsole = (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      };

      page.on("pageerror", onPageError);
      page.on("console", onConsole);

      let status = null;
      let navErr = null;
      let finalUrl = null;

      try {
        const response = await page.goto(`${BASE}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        status = response?.status?.() ?? null;
        await page.waitForTimeout(1200);
        finalUrl = page.url();
      } catch (error) {
        navErr = String(error?.message || error);
        finalUrl = page.url();
      }

      page.off("pageerror", onPageError);
      page.off("console", onConsole);
      await page.close();

      const matchedConsole = consoleErrors.filter((entry) => ERROR_PATTERNS.test(entry));
      const matchedPageErrors = pageErrors.filter((entry) => ERROR_PATTERNS.test(entry));
      const hasFailure = navErr || matchedPageErrors.length || matchedConsole.length;

      if (hasFailure) {
        failures.push({
          route,
          status,
          finalUrl,
          navErr,
          pageErrors: matchedPageErrors,
          consoleErrors: matchedConsole,
        });
      }
    }

    await context.close();
    await browser.close();

    if (!failures.length) {
      console.log("\nNo client runtime failures found in audited routes.");
      return;
    }

    console.log("\n==== FAILURES ====");
    for (const failure of failures) {
      console.log(
        `\nROUTE ${failure.route} status=${failure.status ?? "n/a"} final=${failure.finalUrl ?? "n/a"}`
      );
      if (failure.navErr) console.log(`NAV_ERR: ${failure.navErr}`);
      if (failure.pageErrors.length) {
        console.log("PAGE_ERRORS:");
        for (const entry of failure.pageErrors) console.log(` - ${entry}`);
      }
      if (failure.consoleErrors.length) {
        console.log("CONSOLE_ERRORS:");
        for (const entry of failure.consoleErrors) console.log(` - ${entry}`);
      }
    }

    process.exitCode = 2;
  } finally {
    await stopServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
