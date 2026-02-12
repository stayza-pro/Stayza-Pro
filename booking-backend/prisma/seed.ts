import {
  PrismaClient,
  UserRole,
  RealtorStatus,
  PropertyType,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Clear existing data
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.propertyImage.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.realtor.deleteMany({});
  await prisma.platformSettings.deleteMany({});
  await prisma.user.deleteMany({});

  // Create passwords
  const hashedPassword = await bcrypt.hash("SecurePass123!", 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@stayza.com",
      password: hashedPassword,
      fullName: "System Administrator",
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  // Create realtor user
  const realtorUser = await prisma.user.create({
    data: {
      email: "john.realtor@example.com",
      businessEmail: "business@johnproperties.com",
      password: hashedPassword,
      fullName: "John Anderson",
      firstName: "John",
      lastName: "Anderson",
      role: UserRole.REALTOR,
      isEmailVerified: true,
      businessAddress: "1847 Union Street, San Francisco, CA 94123",
    },
  });

  // Create realtor profile
  const realtor = await prisma.realtor.create({
    data: {
      userId: realtorUser.id,
      businessName: "Anderson Properties",
      slug: "anderson-properties",
      corporateRegNumber: "RC-123456",
      status: RealtorStatus.APPROVED,
      tagline: "Your trusted real estate partner",
      description: "Professional real estate expert with 10+ years experience.",
    },
  });

  // Create guest user
  await prisma.user.create({
    data: {
      email: "mike.guest@example.com",
      password: hashedPassword,
      fullName: "Michael Thompson",
      firstName: "Michael",
      lastName: "Thompson",
      role: UserRole.GUEST,
      isEmailVerified: true,
    },
  });

  // Create property
  const property = await prisma.property.create({
    data: {
      title: "Luxury Downtown Apartment",
      description: "A stunning luxury apartment in downtown San Francisco.",
      address: "123 Market Street, San Francisco, CA 94102",
      city: "San Francisco",
      country: "United States",
      type: PropertyType.APARTMENT,
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      pricePerNight: 250.0,
      isActive: true,
      realtorId: realtor.id,
    },
  });

  // Create property images
  await prisma.propertyImage.createMany({
    data: [
      {
        propertyId: property.id,
        url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600",
        order: 0,
      },
      {
        propertyId: property.id,
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600",
        order: 1,
      },
    ],
  });

  // Create platform settings
  await prisma.platformSettings.createMany({
    data: [
      {
        key: "commission_rate",
        value: 0.07,
        description: "Legacy platform commission rate for successful bookings",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.commission.tiers.v1",
        value: [
          { min: 0, max: 500000, rate: 0.1 },
          { min: 500001, max: 2000000, rate: 0.07 },
          { min: 2000001, max: null, rate: 0.05 },
        ],
        description: "Financial Engine V2 commission tiers",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.commission.monthly_discounts.v1",
        value: [
          { volume: 5000000, reductionRate: 0.005 },
          { volume: 10000000, reductionRate: 0.01 },
          { volume: 20000000, reductionRate: 0.015 },
        ],
        description:
          "Financial Engine V2 monthly room-fee volume discounts (highest threshold only)",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.commission.monthly_discount_cap_rate",
        value: 0.02,
        description: "Financial Engine V2 monthly discount cap rate",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.service_fee.stayza.v1",
        value: {
          percent: 0.01,
          fixed: 100,
          capVariable: 1333,
          capTrigger: 133333,
        },
        description: "Financial Engine V2 stayza service fee component",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.service_fee.processing.local.v1",
        value: {
          percent: 0.015,
          fixed: 100,
          capVariable: 2000,
          capTrigger: 133333,
        },
        description: "Financial Engine V2 local processing fee component",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.service_fee.processing.international.v1",
        value: {
          percent: 0.039,
          fixed: 100,
          noCap: true,
        },
        description: "Financial Engine V2 international processing fee component",
        category: "commission",
        updatedBy: admin.id,
      },
      {
        key: "finance.withdrawal_fee.v1",
        value: {
          percent: 0.003,
          cap: 3000,
          minimumWithdrawal: 1000,
        },
        description: "Financial Engine V2 withdrawal fee configuration",
        category: "payout",
        updatedBy: admin.id,
      },
      {
        key: "payout_threshold",
        value: 10000,
        description: "Minimum amount required before payout processing",
        category: "payout",
        updatedBy: admin.id,
      },
      {
        key: "booking_cancellation_window",
        value: 24,
        description: "Hours before check-in when free cancellation ends",
        category: "booking",
        updatedBy: admin.id,
      },
      {
        key: "auto_payout_enabled",
        value: true,
        description: "Enable automatic payout processing",
        category: "payout",
        updatedBy: admin.id,
      },
      {
        key: "max_property_images",
        value: 10,
        description: "Maximum number of images per property",
        category: "property",
        updatedBy: admin.id,
      },
    ],
  });

  console.log("Database seeding completed");
  console.log(
    "Created: 1 admin, 1 realtor, 1 guest, 1 property with images, 12 platform settings"
  );
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
