import {
  PrismaClient,
  UserRole,
  PropertyType,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (optional - for development)
  console.log("🧹 Cleaning existing data...");
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.unavailableDate.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users with stronger passwords
  const hashedPassword = await bcrypt.hash("SecurePass123!", 10);
  const guestPassword = await bcrypt.hash("GuestPass123!", 10);

  console.log("👥 Creating users...");

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: "admin@bookingsystem.com",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.ADMIN,
      isEmailVerified: true,
      phone: "+1555123000",
      country: "United States",
      city: "New York",
      address: "Admin Office, 5th Avenue",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
  });

  // Host users with diverse backgrounds
  const host1 = await prisma.user.create({
    data: {
      email: "john.host@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Anderson",
      role: UserRole.HOST,
      isEmailVerified: true,
      phone: "+1415555201",
      country: "United States",
      city: "San Francisco",
      address: "1847 Union Street, San Francisco, CA",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1985-03-15"),
    },
  });

  const host2 = await prisma.user.create({
    data: {
      email: "sarah.lagos@example.com",
      password: hashedPassword,
      firstName: "Sarah",
      lastName: "Okafor",
      role: UserRole.HOST,
      isEmailVerified: true,
      phone: "+2348012345678",
      country: "Nigeria",
      city: "Lagos",
      address: "15 Ozumba Mbadiwe Avenue, Victoria Island",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1990-07-22"),
    },
  });

  const host3 = await prisma.user.create({
    data: {
      email: "carlos.madrid@example.com",
      password: hashedPassword,
      firstName: "Carlos",
      lastName: "Rodriguez",
      role: UserRole.HOST,
      isEmailVerified: true,
      phone: "+34912345678",
      country: "Spain",
      city: "Madrid",
      address: "Calle de Alcalá, 123, Madrid",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1982-11-08"),
    },
  });

  const host4 = await prisma.user.create({
    data: {
      email: "priya.mumbai@example.com",
      password: hashedPassword,
      firstName: "Priya",
      lastName: "Sharma",
      role: UserRole.HOST,
      isEmailVerified: true,
      phone: "+919876543210",
      country: "India",
      city: "Mumbai",
      address: "Marine Drive, Mumbai, Maharashtra",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1988-05-30"),
    },
  });

  // Guest users with varied profiles
  const guest1 = await prisma.user.create({
    data: {
      email: "mike.traveler@example.com",
      password: guestPassword,
      firstName: "Michael",
      lastName: "Thompson",
      role: UserRole.GUEST,
      isEmailVerified: true,
      phone: "+447123456789",
      country: "United Kingdom",
      city: "London",
      address: "Baker Street, London",
      avatar:
        "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1992-09-12"),
    },
  });

  const guest2 = await prisma.user.create({
    data: {
      email: "emma.explorer@example.com",
      password: guestPassword,
      firstName: "Emma",
      lastName: "Williams",
      role: UserRole.GUEST,
      isEmailVerified: true,
      phone: "+2347012345678",
      country: "Nigeria",
      city: "Abuja",
      address: "Central Business District, Abuja",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1995-01-18"),
    },
  });

  const guest3 = await prisma.user.create({
    data: {
      email: "alex.digital@example.com",
      password: guestPassword,
      firstName: "Alexander",
      lastName: "Chen",
      role: UserRole.GUEST,
      isEmailVerified: true,
      phone: "+12125551234",
      country: "United States",
      city: "New York",
      address: "Manhattan, New York",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1989-12-03"),
    },
  });

  const guest4 = await prisma.user.create({
    data: {
      email: "lisa.business@example.com",
      password: guestPassword,
      firstName: "Lisa",
      lastName: "Mueller",
      role: UserRole.GUEST,
      isEmailVerified: true,
      phone: "+49301234567",
      country: "Germany",
      city: "Berlin",
      address: "Unter den Linden, Berlin",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      dateOfBirth: new Date("1987-04-25"),
    },
  });

  console.log("🏠 Creating properties...");

  // Create diverse properties across different locations and price ranges
  const property1 = await prisma.property.create({
    data: {
      title: "Luxury Downtown Loft with City Views",
      description:
        "Stunning 2-bedroom loft in SOMA district with floor-to-ceiling windows, modern kitchen, and breathtaking city skyline views. Perfect for business travelers and couples seeking luxury in the heart of San Francisco.",
      type: PropertyType.LOFT,
      pricePerNight: 285.0,
      currency: "USD",
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      amenities: [
        "WiFi",
        "Full Kitchen",
        "Washer & Dryer",
        "Smart TV",
        "Air Conditioning",
        "Parking",
        "Gym Access",
        "Rooftop Terrace",
        "24/7 Concierge",
      ],
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        "https://images.unsplash.com/photo-1560448204-e1a3145c7d75",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
      ],
      address: "123 Market Street, Unit 4B",
      city: "San Francisco",
      state: "California",
      country: "United States",
      latitude: 37.7749,
      longitude: -122.4194,
      hostId: host1.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      title: "Waterfront Villa with Private Pool - Victoria Island",
      description:
        "Exquisite 4-bedroom waterfront villa featuring a private infinity pool, tropical garden, and stunning lagoon views. Ideal for families and luxury getaways with 24/7 security and housekeeping service.",
      type: PropertyType.VILLA,
      pricePerNight: 320.0,
      currency: "USD",
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 4,
      amenities: [
        "WiFi",
        "Gourmet Kitchen",
        "Private Pool",
        "Tropical Garden",
        "Smart TV",
        "Air Conditioning",
        "24/7 Security",
        "Generator Backup",
        "Housekeeping",
        "Private Beach Access",
        "BBQ Area",
      ],
      images: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83",
        "https://images.unsplash.com/photo-1572120360610-d971b9d7767c",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
      ],
      address: "15 Ozumba Mbadiwe Avenue, Victoria Island",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      latitude: 6.4281,
      longitude: 3.4219,
      hostId: host2.id,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      title: "Charming Studio Near Golden Gate Park",
      description:
        "Cozy and well-appointed studio apartment perfect for solo travelers or couples. Walking distance to Golden Gate Park, Haight-Ashbury, and excellent restaurants. Newly renovated with modern amenities.",
      type: PropertyType.STUDIO,
      pricePerNight: 125.0,
      currency: "USD",
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [
        "WiFi",
        "Kitchenette",
        "Smart TV",
        "Heating",
        "Work Desk",
        "Coffee Machine",
      ],
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
        "https://images.unsplash.com/photo-1560184897-ae75f6c60753",
      ],
      address: "789 Haight Street",
      city: "San Francisco",
      state: "California",
      country: "United States",
      latitude: 37.7699,
      longitude: -122.4468,
      hostId: host1.id,
    },
  });

  const property4 = await prisma.property.create({
    data: {
      title: "Historic Apartment in Madrid Center",
      description:
        "Beautiful 3-bedroom apartment in a historic building in the heart of Madrid. Walking distance to Prado Museum, Retiro Park, and the best tapas bars. Recently restored with modern comforts.",
      type: PropertyType.APARTMENT,
      pricePerNight: 180.0,
      currency: "EUR",
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      amenities: [
        "WiFi",
        "Full Kitchen",
        "Washing Machine",
        "TV",
        "Heating",
        "Balcony",
        "Historic Architecture",
        "Central Location",
      ],
      images: [
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
        "https://images.unsplash.com/photo-1574362848149-11496d93a7c7",
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
        "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0",
      ],
      address: "Calle de Alcalá, 123",
      city: "Madrid",
      state: "Madrid",
      country: "Spain",
      latitude: 40.4168,
      longitude: -3.7038,
      hostId: host3.id,
    },
  });

  const property5 = await prisma.property.create({
    data: {
      title: "Modern Penthouse with Sea View - Marine Drive",
      description:
        "Spectacular 3-bedroom penthouse with panoramic Arabian Sea views from Marine Drive. Features a private terrace, modern amenities, and access to Mumbai's most iconic promenade.",
      type: PropertyType.APARTMENT,
      pricePerNight: 150.0,
      currency: "USD",
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      amenities: [
        "WiFi",
        "Full Kitchen",
        "Washing Machine",
        "Smart TV",
        "Air Conditioning",
        "Private Terrace",
        "Sea View",
        "Security",
        "Elevator",
      ],
      images: [
        "https://images.unsplash.com/photo-1554995207-c18c203602cb",
        "https://images.unsplash.com/photo-1567496898669-ee935f5f647a",
        "https://images.unsplash.com/photo-1615874959474-d609969a20ed",
      ],
      address: "Marine Drive, Nariman Point",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      latitude: 18.922,
      longitude: 72.8347,
      hostId: host4.id,
    },
  });

  const property6 = await prisma.property.create({
    data: {
      title: "Budget-Friendly Cottage in Presidio",
      description:
        "Affordable 2-bedroom cottage in the peaceful Presidio area. Great for budget-conscious travelers who want to stay in San Francisco without breaking the bank. Close to Crissy Field and Golden Gate Bridge.",
      type: PropertyType.COTTAGE,
      pricePerNight: 85.0,
      currency: "USD",
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ["WiFi", "Kitchen", "TV", "Heating", "Garden", "Parking"],
      images: [
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
        "https://images.unsplash.com/photo-1502672023488-70e25813eb80",
      ],
      address: "456 Presidio Boulevard",
      city: "San Francisco",
      state: "California",
      country: "United States",
      latitude: 37.7986,
      longitude: -122.4756,
      hostId: host1.id,
    },
  });

  const property7 = await prisma.property.create({
    data: {
      title: "Family Townhouse in Ikoyi",
      description:
        "Spacious 3-bedroom townhouse in the prestigious Ikoyi district. Perfect for families visiting Lagos with easy access to business districts, restaurants, and cultural attractions.",
      type: PropertyType.TOWNHOUSE,
      pricePerNight: 120.0,
      currency: "USD",
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      amenities: [
        "WiFi",
        "Full Kitchen",
        "Washer",
        "TV",
        "Air Conditioning",
        "Generator",
        "Security",
        "Compound Parking",
      ],
      images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      ],
      address: "12 Bourdillon Road, Ikoyi",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      latitude: 6.455,
      longitude: 3.428,
      hostId: host2.id,
    },
  });

  console.log("📅 Creating bookings and payments...");

  // Create realistic bookings with various statuses
  const currentDate = new Date();
  const pastDate1 = new Date();
  pastDate1.setMonth(currentDate.getMonth() - 2);
  const pastDate2 = new Date();
  pastDate2.setMonth(currentDate.getMonth() - 1);
  const futureDate1 = new Date();
  futureDate1.setMonth(currentDate.getMonth() + 1);
  const futureDate2 = new Date();
  futureDate2.setMonth(currentDate.getMonth() + 2);

  // Completed bookings with reviews
  const booking1 = await prisma.booking.create({
    data: {
      checkInDate: new Date(pastDate1.getFullYear(), pastDate1.getMonth(), 15),
      checkOutDate: new Date(pastDate1.getFullYear(), pastDate1.getMonth(), 20),
      totalGuests: 2,
      totalPrice: 1425.0, // 5 nights × 285
      currency: "USD",
      status: BookingStatus.COMPLETED,
      guestId: guest1.id,
      propertyId: property1.id,
      specialRequests: "Late check-in requested, arriving around 11 PM",
      isRefundable: false,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      checkInDate: new Date(pastDate2.getFullYear(), pastDate2.getMonth(), 1),
      checkOutDate: new Date(pastDate2.getFullYear(), pastDate2.getMonth(), 7),
      totalGuests: 6,
      totalPrice: 1920.0, // 6 nights × 320
      currency: "USD",
      status: BookingStatus.COMPLETED,
      guestId: guest2.id,
      propertyId: property2.id,
      specialRequests: "Family with children, need high chair and crib",
      isRefundable: false,
    },
  });

  // Current/upcoming confirmed bookings
  const booking3 = await prisma.booking.create({
    data: {
      checkInDate: new Date(
        futureDate1.getFullYear(),
        futureDate1.getMonth(),
        10
      ),
      checkOutDate: new Date(
        futureDate1.getFullYear(),
        futureDate1.getMonth(),
        14
      ),
      totalGuests: 4,
      totalPrice: 720.0, // 4 nights × 180
      currency: "EUR",
      status: BookingStatus.CONFIRMED,
      guestId: guest3.id,
      propertyId: property4.id,
      specialRequests: "Business trip, need quiet workspace and good WiFi",
      refundDeadline: new Date(
        futureDate1.getFullYear(),
        futureDate1.getMonth(),
        9,
        12,
        0,
        0
      ),
    },
  });

  const booking4 = await prisma.booking.create({
    data: {
      checkInDate: new Date(
        futureDate2.getFullYear(),
        futureDate2.getMonth(),
        5
      ),
      checkOutDate: new Date(
        futureDate2.getFullYear(),
        futureDate2.getMonth(),
        10
      ),
      totalGuests: 4,
      totalPrice: 750.0, // 5 nights × 150
      currency: "USD",
      status: BookingStatus.CONFIRMED,
      guestId: guest4.id,
      propertyId: property5.id,
      specialRequests: "Anniversary trip, would appreciate welcome amenities",
      refundDeadline: new Date(
        futureDate2.getFullYear(),
        futureDate2.getMonth(),
        4,
        12,
        0,
        0
      ),
    },
  });

  // Pending booking (awaiting payment)
  const booking5 = await prisma.booking.create({
    data: {
      checkInDate: new Date(
        futureDate1.getFullYear(),
        futureDate1.getMonth(),
        20
      ),
      checkOutDate: new Date(
        futureDate1.getFullYear(),
        futureDate1.getMonth(),
        23
      ),
      totalGuests: 2,
      totalPrice: 375.0, // 3 nights × 125
      currency: "USD",
      status: BookingStatus.PENDING,
      guestId: guest1.id,
      propertyId: property3.id,
      refundDeadline: new Date(
        futureDate1.getFullYear(),
        futureDate1.getMonth(),
        19,
        12,
        0,
        0
      ),
    },
  });

  // Cancelled booking
  const booking6 = await prisma.booking.create({
    data: {
      checkInDate: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        25
      ),
      checkOutDate: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        28
      ),
      totalGuests: 6,
      totalPrice: 360.0, // 3 nights × 120
      currency: "USD",
      status: BookingStatus.CANCELLED,
      guestId: guest2.id,
      propertyId: property7.id,
      specialRequests: "Group booking for conference attendees",
      isRefundable: false,
    },
  });

  // Create payments for completed bookings
  const payment1 = await prisma.payment.create({
    data: {
      amount: 1425.0,
      currency: "USD",
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
      stripePaymentIntentId: "pi_1234567890abcdef",
      bookingId: booking1.id,
      userId: guest1.id,
      metadata: {
        cardLast4: "4242",
        cardBrand: "visa",
      },
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      amount: 1920.0,
      currency: "USD",
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.PAYSTACK,
      paystackReference: "ps_ref_abcdef1234567890",
      bookingId: booking2.id,
      userId: guest2.id,
      metadata: {
        channel: "card",
        bank: "gtbank",
      },
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      amount: 720.0,
      currency: "EUR",
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
      stripePaymentIntentId: "pi_9876543210fedcba",
      bookingId: booking3.id,
      userId: guest3.id,
      metadata: {
        cardLast4: "1234",
        cardBrand: "mastercard",
      },
    },
  });

  const payment4 = await prisma.payment.create({
    data: {
      amount: 750.0,
      currency: "USD",
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
      stripePaymentIntentId: "pi_anniversary_booking",
      bookingId: booking4.id,
      userId: guest4.id,
    },
  });

  // Pending payment
  await prisma.payment.create({
    data: {
      amount: 375.0,
      currency: "USD",
      status: PaymentStatus.PENDING,
      method: PaymentMethod.STRIPE,
      stripePaymentIntentId: "pi_pending_payment_123",
      bookingId: booking5.id,
      userId: guest1.id,
    },
  });

  // Refunded payment for cancelled booking
  await prisma.payment.create({
    data: {
      amount: 360.0,
      currency: "USD",
      status: PaymentStatus.REFUNDED,
      method: PaymentMethod.PAYSTACK,
      paystackReference: "ps_ref_cancelled_booking",
      bookingId: booking6.id,
      userId: guest2.id,
      refundAmount: 360.0,
      refundReason: "Cancelled by guest due to personal emergency",
    },
  });

  console.log("⭐ Creating reviews...");

  // Create detailed reviews for completed bookings
  await prisma.review.create({
    data: {
      rating: 5,
      comment:
        "Absolutely stunning loft with incredible city views! John was an exceptional host - responsive, helpful, and provided great local recommendations. The apartment was spotless, exactly as described, and the amenities were top-notch. The location is perfect for exploring San Francisco. Would definitely stay again!",
      bookingId: booking1.id,
      authorId: guest1.id,
      propertyId: property1.id,
      targetId: host1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment:
        "Beautiful villa with amazing amenities! The private pool was a hit with the kids, and the location in Victoria Island is excellent. Sarah was very welcoming and made sure we had everything we needed. The only minor issue was occasional power outages, but the generator backup worked well. Great family vacation spot!",
      bookingId: booking2.id,
      authorId: guest2.id,
      propertyId: property2.id,
      targetId: host2.id,
    },
  });

  console.log("🚫 Creating unavailable dates...");

  // Create realistic unavailable dates for properties
  const dates = [];

  // Property 1: Maintenance and personal use dates
  dates.push(
    {
      propertyId: property1.id,
      date: new Date(currentDate.getFullYear(), 11, 25), // Christmas
      reason: "Holiday maintenance",
    },
    {
      propertyId: property1.id,
      date: new Date(currentDate.getFullYear(), 11, 26), // Boxing Day
      reason: "Holiday maintenance",
    },
    {
      propertyId: property1.id,
      date: new Date(currentDate.getFullYear() + 1, 0, 1), // New Year
      reason: "Personal use - Host family visit",
    }
  );

  // Property 2: Host personal use
  dates.push(
    {
      propertyId: property2.id,
      date: new Date(currentDate.getFullYear(), 11, 31), // New Year's Eve
      reason: "Personal use - Host celebration",
    },
    {
      propertyId: property2.id,
      date: new Date(currentDate.getFullYear() + 1, 0, 1), // New Year's Day
      reason: "Personal use - Host celebration",
    }
  );

  // Property 3: Maintenance week
  for (let i = 0; i < 7; i++) {
    const maintenanceDate = new Date(futureDate2);
    maintenanceDate.setDate(15 + i);
    dates.push({
      propertyId: property3.id,
      date: maintenanceDate,
      reason: i === 0 ? "Annual maintenance week" : "Annual maintenance week",
    });
  }

  // Property 4: Host vacation
  dates.push(
    {
      propertyId: property4.id,
      date: new Date(futureDate1.getFullYear(), futureDate1.getMonth(), 25),
      reason: "Host vacation",
    },
    {
      propertyId: property4.id,
      date: new Date(futureDate1.getFullYear(), futureDate1.getMonth(), 26),
      reason: "Host vacation",
    },
    {
      propertyId: property4.id,
      date: new Date(futureDate1.getFullYear(), futureDate1.getMonth(), 27),
      reason: "Host vacation",
    }
  );

  await prisma.unavailableDate.createMany({
    data: dates,
  });

  console.log("🔐 Creating refresh tokens for testing...");

  // Create some refresh tokens for testing authentication
  await prisma.refreshToken.createMany({
    data: [
      {
        token: "refresh_token_admin_" + Date.now(),
        userId: admin.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        token: "refresh_token_host1_" + Date.now(),
        userId: host1.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        token: "refresh_token_guest1_" + Date.now(),
        userId: guest1.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ Database seeding completed successfully!");

  console.log("\n📊 Summary of created data:");
  console.log("👥 Users:", {
    admin: admin.email,
    hosts: [host1.email, host2.email, host3.email, host4.email],
    guests: [guest1.email, guest2.email, guest3.email, guest4.email],
  });

  console.log("🏠 Properties:", {
    total: 7,
    cities: ["San Francisco (3)", "Lagos (2)", "Madrid (1)", "Mumbai (1)"],
    priceRange: "$85 - $320 per night",
  });

  console.log("📅 Bookings:", {
    completed: 2,
    confirmed: 2,
    pending: 1,
    cancelled: 1,
  });

  console.log("💳 Payments:", {
    stripe: 3,
    paystack: 2,
    completed: 4,
    pending: 1,
    refunded: 1,
  });

  console.log("⭐ Reviews:", 2);
  console.log("🚫 Unavailable dates:", dates.length);

  console.log("\n🔑 Test Credentials:");
  console.log("Admin: admin@bookingsystem.com / SecurePass123!");
  console.log("Host: john.host@example.com / SecurePass123!");
  console.log("Guest: mike.traveler@example.com / GuestPass123!");

  console.log("\n🌐 You can now test the API with realistic data!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
