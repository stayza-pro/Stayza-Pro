import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkReferredGuests() {
  try {
    console.log("\n🔍 Checking Referred Guests Setup...\n");

    // Get all realtors
    const realtors = await prisma.realtor.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            referredGuests: true,
            properties: true,
          },
        },
      },
    });

    console.log(`Found ${realtors.length} realtor(s)\n`);

    for (const realtor of realtors) {
      console.log("━".repeat(60));
      console.log(`📋 Realtor: ${realtor.businessName}`);
      console.log(
        `👤 User: ${realtor.user.firstName} ${realtor.user.lastName}`
      );
      console.log(`📧 Email: ${realtor.user.email}`);
      console.log(`🆔 Realtor ID: ${realtor.id}`);
      console.log(`🏠 Properties: ${realtor._count.properties}`);
      console.log(
        `👥 Referred Guests (via _count): ${realtor._count.referredGuests}`
      );

      // Now query guests directly
      const guests = await prisma.user.findMany({
        where: {
          referredByRealtorId: realtor.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          referralSource: true,
          createdAt: true,
        },
      });

      console.log(`👥 Referred Guests (direct query): ${guests.length}`);

      if (guests.length > 0) {
        console.log("\n   Guest Details:");
        guests.forEach((guest, i) => {
          console.log(
            `   ${i + 1}. ${guest.firstName} ${guest.lastName} (${guest.email})`
          );
          console.log(`      Role: ${guest.role}`);
          console.log(
            `      Referral Source: ${guest.referralSource || "N/A"}`
          );
          console.log(`      Created: ${guest.createdAt.toLocaleString()}`);
        });
      }
      console.log();
    }

    // Check all users to see their referral status
    console.log("━".repeat(60));
    console.log("🔎 All Users with Referral Info:\n");

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        referredByRealtorId: true,
        referralSource: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Total Users: ${allUsers.length}\n`);

    for (const user of allUsers) {
      console.log(`👤 ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(
        `   Referred By Realtor ID: ${user.referredByRealtorId || "❌ NOT SET"}`
      );
      console.log(`   Referral Source: ${user.referralSource || "N/A"}`);
      console.log();
    }

    console.log("━".repeat(60));
    console.log("\n✅ Check complete!\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReferredGuests();
