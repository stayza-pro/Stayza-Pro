import { PrismaClient } from "@prisma/client";

const testConnection = async () => {
  const prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });

  try {
    console.log("🔍 Testing database connection...");
    const start = Date.now();

    // Test simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Basic connection: ${Date.now() - start}ms`);

    // Test user count
    const countStart = Date.now();
    const userCount = await prisma.user.count();
    console.log(`✅ User count (${userCount}): ${Date.now() - countStart}ms`);

    // Test admin user query (simulating login)
    const loginStart = Date.now();
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@stayza.com" },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        fullName: true,
        role: true,
        avatar: true,
        phone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        realtor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            status: true,
          },
        },
      },
    });
    console.log(`✅ Admin login query: ${Date.now() - loginStart}ms`);
    console.log(`   Found admin: ${adminUser ? "Yes" : "No"}`);

    // Test with a delay to check if connection stays alive
    console.log("⏳ Waiting 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const delayedStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Delayed query: ${Date.now() - delayedStart}ms`);

    console.log("\n✅ All database tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

testConnection();
