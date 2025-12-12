const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = 'http://localhost:5050/api';
const JWT_SECRET = process.env.JWT_SECRET;
const USER_ID = 'cmivrjc1f000attvksgxfjclp';
const PROPERTY_ID = 'cmix2a8210001ttlkip65aky1';

async function testBookingFlow() {
  try {
    // Step 1: Generate JWT token
    console.log('\n🔑 Step 1: Generating JWT token...');
    const token = jwt.sign(
      { 
        id: USER_ID,  // Changed from userId to id
        email: 'soodelight1@gmail.com', 
        role: 'GUEST' 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    console.log('✅ Token generated');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Step 2: Create booking
    console.log('\n📅 Step 2: Creating booking...');
    const bookingResponse = await axios.post(`${BASE_URL}/bookings`, {
      propertyId: PROPERTY_ID,
      checkInDate: '2026-01-15',
      checkOutDate: '2026-01-18',
      totalGuests: 2
    }, { headers });

    const booking = bookingResponse.data.data;
    console.log('✅ Booking created:', {
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice
    });

    // Step 3: Initialize Paystack payment
    console.log('\n💳 Step 3: Initializing Paystack payment...');
    const paymentResponse = await axios.post(`${BASE_URL}/payments/initialize-paystack`, {
      bookingId: booking.id
    }, { headers });

    const paymentData = paymentResponse.data.data;
    console.log('✅ Payment initialized:', {
      reference: paymentData.reference,
      authorizationUrl: paymentData.authorizationUrl,
      paymentStatus: paymentData.payment?.status,
      bookingPaymentStatus: paymentData.booking?.paymentStatus
    });

    // Step 4: Check if payment record was created
    console.log('\n🔍 Step 4: Verifying payment record in database...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const bookingWithPayment = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { payment: true }
    });

    console.log('📊 Database status:');
    console.log('   Booking status:', bookingWithPayment.status);
    console.log('   Payment status:', bookingWithPayment.paymentStatus);
    console.log('   Payment record exists:', !!bookingWithPayment.payment);
    
    if (bookingWithPayment.payment) {
      console.log('   Payment details:', {
        id: bookingWithPayment.payment.id,
        status: bookingWithPayment.payment.status,
        method: bookingWithPayment.payment.method,
        reference: bookingWithPayment.payment.reference
      });
    }

    await prisma.$disconnect();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Booking created successfully');
    console.log('✅ Payment initialization endpoint called');
    console.log(bookingWithPayment.payment ? '✅ Payment record created in DB' : '❌ Payment record NOT created in DB');
    console.log(bookingWithPayment.paymentStatus === 'PENDING' ? '✅ Booking paymentStatus updated to PENDING' : '❌ Booking paymentStatus still: ' + bookingWithPayment.paymentStatus);
    console.log('='.repeat(50));

    if (!bookingWithPayment.payment) {
      console.log('\n⚠️  ISSUE CONFIRMED: Payment initialization endpoint is not creating payment records!');
    } else {
      console.log('\n✅ Backend is working correctly. Issue is likely in frontend.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testBookingFlow();
