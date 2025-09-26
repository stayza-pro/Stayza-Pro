import { PrismaClient } from "@prisma/client";

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
