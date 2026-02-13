import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(SCRIPT_DIR, "..");
const PORT = Number(process.env.PORT || 3100);
const EXTERNAL_BASE = process.env.BASE_URL?.trim();
const BASE_URL = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;

const routes = [
  "/",
  "/guest-landing",
  "/guest",
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
  "/help",
  "/privacy",
  "/terms",
  "/legal/privacy",
  "/legal/terms",
  "/join-waitlist",
  "/get-started",
  "/how-it-works",
  "/booking-website-for-realtors",
  "/auth/verify-otp",
  "/verify-email",
  "/become-host",
];

const breakpoints = [
  { label: "w320", width: 320, height: 812 },
  { label: "w375", width: 375, height: 812 },
  { label: "w390", width: 390, height: 844 },
  { label: "w768", width: 768, height: 1024 },
  { label: "w1024", width: 1024, height: 900 },
];

const outDir = path.join(FRONTEND_ROOT, "qa-artifacts", "breakpoint");

function toSlug(route) {
  if (route === "/") return "root";
  return route.replace(/^\//, "").replace(/\//g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`);
}

async function canReachBase(url, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.status >= 200 && res.status < 600;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function startNextServer() {
  if (EXTERNAL_BASE) return null;
  const child = spawn("npm run start -- -p " + String(PORT), [], {
    cwd: FRONTEND_ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[next] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[next:err] ${chunk}`);
  });

  return child;
}

async function ensureServer() {
  if (EXTERNAL_BASE) return null;
  const alreadyRunning = await canReachBase(BASE_URL);
  if (alreadyRunning) {
    console.log(`[qa] Reusing existing server: ${BASE_URL}`);
    return null;
  }
  const child = startNextServer();
  await waitForServer(BASE_URL);
  return child;
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
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    console.warn(
      "[qa] Bundled Playwright Chromium unavailable, trying installed Edge:",
      error instanceof Error ? error.message : String(error)
    );
    return chromium.launch({ headless: true, channel: "msedge" });
  }
}

async function run() {
  await mkdir(outDir, { recursive: true });

  const server = await ensureServer();
  try {
    const browser = await launchBrowser();
    const results = [];

    for (const route of routes) {
      for (const bp of breakpoints) {
        const context = await browser.newContext({
          viewport: { width: bp.width, height: bp.height },
        });
        const page = await context.newPage();

        const consoleErrors = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(msg.text());
          }
        });

        let navigationError = null;
        let status = null;
        let finalUrl = null;
        let overflow = null;
        let rootScrollWidth = null;
        let bodyScrollWidth = null;

        const targetUrl = `${BASE_URL}${route}`;

        try {
          const response = await page.goto(targetUrl, {
            waitUntil: "networkidle",
            timeout: 60000,
          });
          status = response ? response.status() : null;

          await page.waitForTimeout(1000);

          const metrics = await page.evaluate(() => {
            const de = document.documentElement;
            const body = document.body;
            const rootWidth = de ? de.scrollWidth : 0;
            const bodyWidth = body ? body.scrollWidth : 0;
            const viewport = window.innerWidth;
            const hasOverflow = rootWidth > viewport + 1 || bodyWidth > viewport + 1;
            return {
              hasOverflow,
              rootWidth,
              bodyWidth,
              viewport,
            };
          });

          overflow = metrics.hasOverflow;
          rootScrollWidth = metrics.rootWidth;
          bodyScrollWidth = metrics.bodyWidth;
          finalUrl = page.url();
        } catch (error) {
          navigationError = error instanceof Error ? error.message : String(error);
          finalUrl = page.url();
        }

        const shotPath = path.join(outDir, `${toSlug(route)}-${bp.label}.png`);
        try {
          await page.screenshot({ path: shotPath, fullPage: true });
        } catch {
          // keep report even if screenshot fails
        }

        const pass = !navigationError && overflow === false;

        results.push({
          route,
          breakpoint: bp.label,
          width: bp.width,
          height: bp.height,
          targetUrl,
          finalUrl,
          status,
          overflow,
          rootScrollWidth,
          bodyScrollWidth,
          consoleErrorCount: consoleErrors.length,
          navigationError,
          pass,
          screenshot: path.relative(FRONTEND_ROOT, shotPath).replace(/\\/g, "/"),
        });

        await context.close();
      }
    }

    await browser.close();

    const reportJsonPath = path.join(outDir, "guest-breakpoint-report.json");
    await writeFile(reportJsonPath, JSON.stringify(results, null, 2), "utf8");

    const total = results.length;
    const passed = results.filter((r) => r.pass).length;
    const failed = total - passed;

    const groupedFailures = results.filter((r) => !r.pass);

    let md = "# Guest Breakpoint QA Report\n\n";
    md += `- Total checks: ${total}\n`;
    md += `- Passed: ${passed}\n`;
    md += `- Failed: ${failed}\n\n`;

    if (groupedFailures.length === 0) {
      md += "All route/breakpoint checks passed (no horizontal overflow and no navigation errors).\n";
    } else {
      md += "## Failures\n\n";
      for (const f of groupedFailures) {
        md += `- ${f.route} @ ${f.breakpoint} (${f.width}x${f.height}) | status=${f.status ?? "n/a"} | overflow=${f.overflow} | navError=${f.navigationError ?? "none"} | screenshot=${f.screenshot}\n`;
      }
      md += "\n";
    }

    md += "## Raw Results\n\n";
    md += "| Route | Breakpoint | Status | Overflow | Console Errors | Pass | Screenshot |\n";
    md += "|---|---:|---:|---:|---:|---:|---|\n";
    for (const r of results) {
      md += `| ${r.route} | ${r.breakpoint} | ${r.status ?? "n/a"} | ${r.overflow} | ${r.consoleErrorCount} | ${r.pass ? "yes" : "no"} | ${r.screenshot} |\n`;
    }

    const reportMdPath = path.join(outDir, "guest-breakpoint-report.md");
    await writeFile(reportMdPath, md, "utf8");

    console.log(`\nReport written:`);
    console.log(`- ${path.relative(FRONTEND_ROOT, reportJsonPath).replace(/\\/g, "/")}`);
    console.log(`- ${path.relative(FRONTEND_ROOT, reportMdPath).replace(/\\/g, "/")}`);

    if (failed > 0) {
      process.exitCode = 2;
    }
  } finally {
    await stopServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
