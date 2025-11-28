import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRealtorAuth() {
  try {
    console.log("🔍 Testing realtor authentication requirements...");

    // Find the realtor user
    const realtorUser = await prisma.user.findFirst({
      where: { role: "REALTOR" },
      include: {
        realtor: true,
      },
    });

    if (!realtorUser) {
      console.log("❌ No realtor user found");
      return;
    }

    console.log("👤 Realtor User Found:");
    console.log(`  Email: ${realtorUser.email}`);
    console.log(`  Role: ${realtorUser.role}`);
    console.log(`  User ID: ${realtorUser.id}`);

    if (realtorUser.realtor) {
      console.log("🏢 Realtor Profile:");
      console.log(`  Business: ${realtorUser.realtor.businessName}`);
      console.log(`  Status: ${realtorUser.realtor.status}`);
      console.log(`  CAC Status: ${realtorUser.realtor.cacStatus}`);
      console.log(`  Suspended: ${!!realtorUser.realtor.suspendedAt}`);
      console.log(
        `  Colors: ${realtorUser.realtor.primaryColor}, ${realtorUser.realtor.secondaryColor}, ${realtorUser.realtor.accentColor}`
      );

      // Check if this realtor passes all middleware requirements
      const passesMiddleware =
        realtorUser.role === "REALTOR" &&
        realtorUser.realtor.status === "APPROVED" &&
        realtorUser.realtor.cacStatus === "APPROVED" &&
        !realtorUser.realtor.suspendedAt;

      console.log(
        `\n✅ Middleware Check: ${passesMiddleware ? "PASS" : "FAIL"}`
      );

      if (passesMiddleware) {
        console.log("🎉 Realtor should be able to access protected endpoints!");
        console.log("📧 To test, login with:", realtorUser.email);
      }
    } else {
      console.log("❌ No realtor profile found for this user");
    }
  } catch (error) {
    console.error("❌ Error testing realtor auth:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtorAuth();
