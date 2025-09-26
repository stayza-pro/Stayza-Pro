"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Starting database seeding...");
    const hashedPassword = await bcrypt_1.default.hash("password123", 10);
    const admin = await prisma.user.create({
        data: {
            email: "admin@bookingsystem.com",
            password: hashedPassword,
            firstName: "Admin",
            lastName: "User",
            role: client_1.UserRole.ADMIN,
            isEmailVerified: true,
            phone: "+1234567890",
            country: "United States",
            city: "New York",
        },
    });
    const host1 = await prisma.user.create({
        data: {
            email: "john.host@example.com",
            password: hashedPassword,
            firstName: "John",
            lastName: "Doe",
            role: client_1.UserRole.HOST,
            isEmailVerified: true,
            phone: "+1987654321",
            country: "United States",
            city: "San Francisco",
        },
    });
    const host2 = await prisma.user.create({
        data: {
            email: "sarah.host@example.com",
            password: hashedPassword,
            firstName: "Sarah",
            lastName: "Johnson",
            role: client_1.UserRole.HOST,
            isEmailVerified: true,
            phone: "+2348012345678",
            country: "Nigeria",
            city: "Lagos",
        },
    });
    const guest1 = await prisma.user.create({
        data: {
            email: "mike.guest@example.com",
            password: hashedPassword,
            firstName: "Mike",
            lastName: "Wilson",
            role: client_1.UserRole.GUEST,
            isEmailVerified: true,
            phone: "+4407123456789",
            country: "United Kingdom",
            city: "London",
        },
    });
    const guest2 = await prisma.user.create({
        data: {
            email: "emma.guest@example.com",
            password: hashedPassword,
            firstName: "Emma",
            lastName: "Brown",
            role: client_1.UserRole.GUEST,
            isEmailVerified: true,
            phone: "+2347012345678",
            country: "Nigeria",
            city: "Abuja",
        },
    });
    const property1 = await prisma.property.create({
        data: {
            title: "Modern Downtown Apartment",
            description: "Beautiful 2-bedroom apartment in the heart of downtown San Francisco with stunning city views.",
            type: client_1.PropertyType.APARTMENT,
            pricePerNight: 150.0,
            currency: "USD",
            maxGuests: 4,
            bedrooms: 2,
            bathrooms: 2,
            amenities: [
                "WiFi",
                "Kitchen",
                "Washer",
                "TV",
                "Air conditioning",
                "Parking",
            ],
            images: [
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
                "https://images.unsplash.com/photo-1560448204-e1a3145c7d75",
            ],
            address: "123 Market Street, Apt 4B",
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
            title: "Luxury Villa in Victoria Island",
            description: "Spacious 4-bedroom villa with private pool and garden, perfect for families and groups.",
            type: client_1.PropertyType.VILLA,
            pricePerNight: 200.0,
            currency: "USD",
            maxGuests: 8,
            bedrooms: 4,
            bathrooms: 3,
            amenities: [
                "WiFi",
                "Kitchen",
                "Pool",
                "Garden",
                "TV",
                "Air conditioning",
                "Security",
                "Generator",
            ],
            images: [
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
                "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83",
                "https://images.unsplash.com/photo-1572120360610-d971b9d7767c",
            ],
            address: "15 Ozumba Mbadiwe Avenue",
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
            title: "Cozy Studio Near Golden Gate",
            description: "Perfect studio apartment for solo travelers or couples, walking distance to Golden Gate Park.",
            type: client_1.PropertyType.STUDIO,
            pricePerNight: 85.0,
            currency: "USD",
            maxGuests: 2,
            bedrooms: 1,
            bathrooms: 1,
            amenities: ["WiFi", "Kitchen", "TV", "Heating"],
            images: [
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
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
    const booking1 = await prisma.booking.create({
        data: {
            checkInDate: new Date("2024-12-15"),
            checkOutDate: new Date("2024-12-20"),
            totalGuests: 2,
            totalPrice: 750.0,
            currency: "USD",
            status: client_1.BookingStatus.CONFIRMED,
            guestId: guest1.id,
            propertyId: property1.id,
            refundDeadline: new Date("2024-12-14T12:00:00Z"),
        },
    });
    const booking2 = await prisma.booking.create({
        data: {
            checkInDate: new Date("2024-11-01"),
            checkOutDate: new Date("2024-11-05"),
            totalGuests: 6,
            totalPrice: 800.0,
            currency: "USD",
            status: client_1.BookingStatus.COMPLETED,
            guestId: guest2.id,
            propertyId: property2.id,
            refundDeadline: new Date("2024-10-31T12:00:00Z"),
            isRefundable: false,
        },
    });
    await prisma.payment.create({
        data: {
            amount: 750.0,
            currency: "USD",
            status: client_1.PaymentStatus.COMPLETED,
            method: client_1.PaymentMethod.STRIPE,
            stripePaymentIntentId: "pi_test_123456789",
            bookingId: booking1.id,
            userId: guest1.id,
        },
    });
    await prisma.payment.create({
        data: {
            amount: 800.0,
            currency: "USD",
            status: client_1.PaymentStatus.COMPLETED,
            method: client_1.PaymentMethod.PAYSTACK,
            paystackReference: "ps_ref_123456789",
            bookingId: booking2.id,
            userId: guest2.id,
        },
    });
    await prisma.review.create({
        data: {
            rating: 5,
            comment: "Amazing villa with excellent amenities! The host was very responsive and helpful.",
            bookingId: booking2.id,
            authorId: guest2.id,
            propertyId: property2.id,
            targetId: host2.id,
        },
    });
    await prisma.unavailableDate.createMany({
        data: [
            {
                propertyId: property1.id,
                date: new Date("2024-12-25"),
                reason: "Christmas maintenance",
            },
            {
                propertyId: property1.id,
                date: new Date("2024-12-26"),
                reason: "Christmas maintenance",
            },
            {
                propertyId: property2.id,
                date: new Date("2024-12-31"),
                reason: "New Year personal use",
            },
        ],
    });
    console.log("Database seeding completed successfully!");
    console.log("Created users:", {
        admin: admin.id,
        host1: host1.id,
        host2: host2.id,
        guest1: guest1.id,
        guest2: guest2.id,
    });
    console.log("Created properties:", {
        property1: property1.id,
        property2: property2.id,
        property3: property3.id,
    });
}
main()
    .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map