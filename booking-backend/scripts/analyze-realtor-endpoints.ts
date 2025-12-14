import * as fs from "fs";
import * as path from "path";

const filePath = path.join(__dirname, "../src/routes/realtorRoutes.ts");
const content = fs.readFileSync(filePath, "utf-8");
const lines = content.split("\n");

const endpoints: Array<{ method: string; path: string; line: number }> = [];
let currentPath = "";
let currentMethod = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Match router method definitions
  const methodMatch = line.match(/router\.(get|post|put|delete|patch)\(/);
  if (methodMatch) {
    currentMethod = methodMatch[1].toUpperCase();

    // Look ahead to find the path
    for (let j = i; j < Math.min(i + 5, lines.length); j++) {
      const pathMatch = lines[j].match(/["']([^"']+)["']/);
      if (pathMatch) {
        currentPath = pathMatch[1];
        endpoints.push({
          method: currentMethod,
          path: currentPath,
          line: i + 1,
        });
        break;
      }
    }
  }
}

console.log("\n" + "=".repeat(80));
console.log("📊 REALTOR ENDPOINTS SUMMARY");
console.log("=".repeat(80) + "\n");

// Group by resource
const grouped: Record<string, typeof endpoints> = {};

endpoints.forEach((ep) => {
  const resource = ep.path.split("/")[1] || "root";
  if (!grouped[resource]) grouped[resource] = [];
  grouped[resource].push(ep);
});

let totalCount = 0;

Object.keys(grouped)
  .sort()
  .forEach((resource) => {
    const resourceEndpoints = grouped[resource];
    console.log(`\n📁 /${resource}/ (${resourceEndpoints.length} endpoints)`);
    console.log("─".repeat(80));

    resourceEndpoints.forEach((ep) => {
      console.log(`  ${ep.method.padEnd(7)} /api/realtors${ep.path}`);
      totalCount++;
    });
  });

console.log("\n" + "=".repeat(80));
console.log(`✅ TOTAL: ${totalCount} realtor endpoints`);
console.log("=".repeat(80) + "\n");

// Identify mergeable endpoints
console.log("\n💡 MERGEABLE ENDPOINT OPPORTUNITIES:\n");

const mergeable = [
  {
    group: "Profile Management",
    endpoints: ["GET /profile", "PUT /profile"],
    suggestion: "Already optimal - separate GET/PUT for profile",
  },
  {
    group: "Registration Flow",
    endpoints: [
      "POST /register",
      "POST /verify-email",
      "POST /resend-verification",
      "POST /appeal-cac-rejection",
    ],
    suggestion: "Keep separate - different stages of registration",
  },
  {
    group: "Status Checks",
    endpoints: [
      "GET /approval-status",
      "GET /paystack/status",
      "GET /flutterwave/status",
    ],
    suggestion:
      "Could merge into: GET /status?provider=paystack|flutterwave|approval",
  },
  {
    group: "Payment Setup",
    endpoints: [
      "POST /paystack/setup-subaccount",
      "POST /flutterwave/setup-subaccount",
    ],
    suggestion:
      "Could merge into: POST /payment/setup?provider=paystack|flutterwave",
  },
  {
    group: "Payout Management",
    endpoints: ["GET /payouts", "POST /payouts/request"],
    suggestion: "Already optimal - list and create separated",
  },
  {
    group: "Booking Management",
    endpoints: [
      "GET /bookings",
      "PUT /bookings/:id/accept",
      "PUT /bookings/:id/cancel",
    ],
    suggestion: "Could merge into: PATCH /bookings/:id with action in body",
  },
  {
    group: "Analytics",
    endpoints: ["GET /analytics", "GET /properties/:id/analytics"],
    suggestion: "Keep separate - different scope (all vs single property)",
  },
];

mergeable.forEach((group, i) => {
  console.log(`${i + 1}. ${group.group}`);
  console.log("   Current:");
  group.endpoints.forEach((ep) => console.log(`     - ${ep}`));
  console.log(`   💭 ${group.suggestion}\n`);
});

console.log("=".repeat(80) + "\n");
