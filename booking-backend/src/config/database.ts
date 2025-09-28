import { PrismaClient } from "@prisma/client";

// Force Prisma to use the binary query engine on Node 24+ when no explicit preference is
// provided. The binary engine runs as a separate executable and avoids Node-API
// compatibility issues introduced in newer Node.js releases.
const nodeMajorVersion = Number(process.versions.node.split(".")[0] ?? "0");

if (nodeMajorVersion >= 24 && !process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

// Global PrismaClient instance
let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance
  // across hot-reloads
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.__prisma;
}

export { prisma };

// Graceful shutdown handler
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
