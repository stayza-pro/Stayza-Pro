import "dotenv/config";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "@/config/database";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@stayza.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME?.trim() || "System";
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME?.trim() || "Administrator";

async function main() {
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD is required and must be at least 8 characters.",
    );
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const fullName = `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`.trim();

  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: ADMIN_EMAIL,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      role: true,
      email: true,
    },
  });

  if (!existingUser) {
    const created = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        fullName,
        role: UserRole.ADMIN,
        isEmailVerified: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log("✅ Admin account created", created);
    return;
  }

  const updated = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      fullName,
      isEmailVerified: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log("✅ Admin account updated", updated);
}

main()
  .catch((error) => {
    console.error("❌ Failed to bootstrap admin account:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
