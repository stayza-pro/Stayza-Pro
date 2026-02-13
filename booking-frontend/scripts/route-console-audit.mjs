import { spawn } from "node:child_process";
import process from "node:process";
import { chromium } from "playwright";

const PORT = 3101;
const BASE = `http://127.0.0.1:${PORT}`;

const routes = [
  "/",
  "/guest-landing",
  "/browse",
  "/browse/does-not-exist",
  "/guest",
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
  "/booking-website-for-realtors",
  "/how-it-works",
  "/get-started",
  "/join-waitlist",
  "/legal/privacy",
  "/legal/terms",
  "/help",
  "/privacy",
  "/terms",
  "/realtor",
  "/realtor/login",
  "/dashboard",
  "/bookings",
  "/properties",
  "/messages",
  "/notifications",
  "/verify-booking",
  "/admin",
  "/admin/login",
  "/admin/settings",
];

function startDevServer() {
  const cmd = `npm run dev -- -p ${PORT}`;
  const child = spawn(cmd, [], {
    cwd: process.cwd(),
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "development" },
  });
  child.stdout.on("data", (d) => process.stdout.write(`[dev] ${d}`));
  child.stderr.on("data", (d) => process.stderr.write(`[dev:err] ${d}`));
  return child;
}

async function waitForServer(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE);
      if (r.status >= 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Dev server timeout");
}

async function run() {
  const dev = startDevServer();
  try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

    const failures = [];

    for (const route of routes) {
      const pageErrors = [];
      const consoleErrors = [];

      const onPageError = (err) => pageErrors.push(String(err?.stack || err?.message || err));
      const onConsole = (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      };

      page.on("pageerror", onPageError);
      page.on("console", onConsole);

      let navErr = null;
      let status = null;
      try {
        const res = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 45000 });
        status = res?.status?.() ?? null;
        await page.waitForTimeout(800);
      } catch (e) {
        navErr = String(e?.message || e);
      }

      page.off("pageerror", onPageError);
      page.off("console", onConsole);

      if (navErr || pageErrors.length || consoleErrors.some((e) => /Application error|TypeError|ReferenceError|Unhandled Runtime Error|client-side exception/i.test(e))) {
        failures.push({ route, status, navErr, pageErrors, consoleErrors: consoleErrors.slice(0, 8) });
      }
    }

    await browser.close();

    if (!failures.length) {
      console.log("\nNo runtime failures detected in audited routes.");
      return;
    }

    console.log("\nRuntime failures detected:");
    for (const f of failures) {
      console.log(`\nROUTE: ${f.route} status=${f.status ?? "n/a"}`);
      if (f.navErr) console.log(`NAV_ERR: ${f.navErr}`);
      if (f.pageErrors.length) {
        console.log("PAGE_ERRORS:");
        for (const e of f.pageErrors) console.log(` - ${e}`);
      }
      if (f.consoleErrors.length) {
        console.log("CONSOLE_ERRORS:");
        for (const e of f.consoleErrors) console.log(` - ${e}`);
      }
    }

    process.exitCode = 2;
  } finally {
    if (dev && !dev.killed) dev.kill("SIGTERM");
  }
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
