import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRealtorProfile() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🔍 REALTOR PROFILE & ANALYTICS - BACKEND RESPONSE");
    console.log("=".repeat(70) + "\n");

    // Get the realtor
    const realtor = await prisma.realtor.findFirst({
      where: { businessName: "Anderson Properties" },
    });

    if (!realtor) {
      console.log("❌ No realtor found");
      return;
    }

    console.log("📋 Realtor Found:", realtor.businessName);
    console.log("🆔 Realtor ID:", realtor.id);
    console.log();

    // Simulate GET /api/realtors/profile response
    console.log("━".repeat(70));
    console.log("1️⃣  GET /api/realtors/profile - RESPONSE:");
    console.log("━".repeat(70));

    const profileData = await prisma.realtor.findUnique({
      where: { id: realtor.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
            type: true,
            pricePerNight: true,
            currency: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            properties: true,
            referredGuests: true,
          },
        },
      },
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          message: "Realtor profile retrieved successfully",
          data: {
            realtor: {
              id: profileData?.id,
              businessName: profileData?.businessName,
              slug: profileData?.slug,
              user: profileData?.user,
              properties:
                profileData?.properties.length +
                " properties (truncated for display)",
              _count: profileData?._count, // 👈 THIS IS WHERE YOU'LL SEE GUEST COUNT
            },
          },
        },
        null,
        2
      )
    );

    console.log("\n✨ KEY FIELD:");
    console.log(
      "   _count.referredGuests =",
      profileData?._count.referredGuests
    );
    console.log("   _count.properties =", profileData?._count.properties);

    // Simulate GET /api/realtors/analytics response
    console.log("\n" + "━".repeat(70));
    console.log("2️⃣  GET /api/realtors/analytics - RESPONSE (Guest Section):");
    console.log("━".repeat(70));

    const [referredGuestsTotal, referredGuestsCurrent] = await Promise.all([
      prisma.user.count({
        where: {
          referredByRealtorId: realtor.id,
          role: "GUEST",
        },
      }),
      prisma.user.count({
        where: {
          referredByRealtorId: realtor.id,
          role: "GUEST",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      }),
    ]);

    console.log(
      JSON.stringify(
        {
          success: true,
          message: "Realtor analytics retrieved successfully",
          data: {
            overview: {
              guests: {
                total: referredGuestsTotal, // 👈 ALL-TIME REFERRED GUESTS
                newInPeriod: referredGuestsCurrent, // 👈 NEW GUESTS IN TIME RANGE
              },
              // ... other analytics data
            },
          },
        },
        null,
        2
      )
    );

    console.log("\n✨ KEY FIELDS:");
    console.log("   guests.total =", referredGuestsTotal, "(all-time)");
    console.log(
      "   guests.newInPeriod =",
      referredGuestsCurrent,
      "(last 30 days)"
    );

    // Show actual guest data
    console.log("\n" + "━".repeat(70));
    console.log("3️⃣  ACTUAL REFERRED GUESTS IN DATABASE:");
    console.log("━".repeat(70));

    const guests = await prisma.user.findMany({
      where: {
        referredByRealtorId: realtor.id,
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        referralSource: true,
        createdAt: true,
      },
    });

    if (guests.length === 0) {
      console.log("\n❌ NO GUESTS FOUND");
      console.log("\nWhy? Let's check:");

      const allGuests = await prisma.user.findMany({
        where: { role: "GUEST" },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          referredByRealtorId: true,
          referralSource: true,
        },
      });

      console.log(`\nTotal guests in database: ${allGuests.length}`);
      allGuests.forEach((g) => {
        console.log(`  - ${g.firstName} ${g.lastName} (${g.email})`);
        console.log(
          `    referredByRealtorId: ${g.referredByRealtorId || "❌ NULL"}`
        );
        console.log(`    referralSource: ${g.referralSource || "None"}`);
      });

      console.log("\n🔧 ISSUE: referredByRealtorId is NULL!");
      console.log("📝 This means the frontend is NOT sending the realtorId");
      console.log(
        "💡 Solution: Frontend needs to send realtorId in registration payload"
      );
    } else {
      console.log(`\n✅ Found ${guests.length} referred guest(s):\n`);
      guests.forEach((g, i) => {
        console.log(`${i + 1}. ${g.firstName} ${g.lastName}`);
        console.log(`   Email: ${g.email}`);
        console.log(`   Role: ${g.role}`);
        console.log(`   Referral Source: ${g.referralSource || "N/A"}`);
        console.log(`   Registered: ${g.createdAt.toLocaleString()}`);
        console.log();
      });
    }

    console.log("━".repeat(70));
    console.log("✅ Test Complete!");
    console.log("━".repeat(70) + "\n");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealtorProfile();
