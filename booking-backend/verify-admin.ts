import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function verifyAdmin() {
  console.log("🔍 Checking admin user...\n");

  const admin = await prisma.user.findUnique({
    where: { email: "admin@stayza.com" },
  });

  if (!admin) {
    console.log("❌ Admin user not found!");
    return;
  }

  console.log("✅ Admin user found:");
  console.log("   Email:", admin.email);
  console.log("   Name:", admin.firstName, admin.lastName);
  console.log("   Role:", admin.role);
  console.log("   Email Verified:", admin.isEmailVerified);
  console.log("   Password Hash:", admin.password.substring(0, 20) + "...");
  console.log("");

  // Test password comparison
  const testPassword = "SecurePass123!";
  console.log("🔐 Testing password:", testPassword);

  const match = await bcrypt.compare(testPassword, admin.password);
  console.log("   Result:", match ? "✅ MATCH" : "❌ NO MATCH");

  if (!match) {
    console.log("\n⚠️  Password doesn't match! Creating correct hash...");
    const correctHash = await bcrypt.hash(testPassword, 10);
    console.log(
      "   Correct hash would be:",
      correctHash.substring(0, 20) + "..."
    );

    // Update the admin password
    await prisma.user.update({
      where: { email: "admin@stayza.com" },
      data: { password: correctHash },
    });
    console.log("✅ Admin password updated!");
  }

  await prisma.$disconnect();
}

verifyAdmin().catch(console.error);
