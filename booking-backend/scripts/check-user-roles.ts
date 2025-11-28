import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    console.log("🔍 Checking user roles and relationships...");

    // Get all users and their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        realtor: {
          select: {
            id: true,
            businessName: true,
            status: true,
            cacStatus: true,
          },
        },
      },
    });

    console.log("📊 Current Users:");
    users.forEach((user) => {
      console.log(`- ${user.email} (Role: ${user.role})`);
      if (user.realtor) {
        console.log(
          `  → Realtor: ${user.realtor.businessName} (${user.realtor.status}/${user.realtor.cacStatus})`
        );
      } else if (user.role === "REALTOR") {
        console.log(`  → ⚠️ REALTOR role but no realtor profile!`);
      }
    });

    // Check for REALTOR users without realtor profiles
    const realtorUsersWithoutProfile = users.filter(
      (user) => user.role === "REALTOR" && !user.realtor
    );

    if (realtorUsersWithoutProfile.length > 0) {
      console.log(
        "\n🔧 Found REALTOR users without profiles. Creating profiles..."
      );

      for (const user of realtorUsersWithoutProfile) {
        await prisma.realtor.create({
          data: {
            userId: user.id,
            businessName: `Business for ${user.email}`,
            slug: `realtor-${user.id.slice(-6)}`,
            status: "APPROVED",
            cacStatus: "APPROVED",
            cacVerifiedAt: new Date(),
            primaryColor: "#DC2626",
            secondaryColor: "#059669",
            accentColor: "#D97706",
            canAppeal: true,
          },
        });
        console.log(`✅ Created realtor profile for ${user.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking user roles:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
