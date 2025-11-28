import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setPendingStatus() {
  try {
    console.log("🔄 Setting realtor to pending CAC status for testing...");

    const updateResult = await prisma.realtor.updateMany({
      data: {
        cacStatus: "PENDING", // Set to pending to test the approval page
        cacVerifiedAt: null,
      },
    });

    console.log(
      `✅ Updated ${updateResult.count} realtors to PENDING CAC status`
    );

    // Verify the change
    const realtors = await prisma.realtor.findMany({
      select: {
        businessName: true,
        status: true,
        cacStatus: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log("\n📊 Current Realtor Status:");
    realtors.forEach((realtor) => {
      console.log(`- ${realtor.businessName} (${realtor.user.email})`);
      console.log(`  Status: ${realtor.status}, CAC: ${realtor.cacStatus}`);
    });
  } catch (error) {
    console.error("❌ Error setting pending status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setPendingStatus();
