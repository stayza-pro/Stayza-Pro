# Payment Flow Integration - Complete Documentation

## Overview
This document outlines the complete end-to-end payment flow integration between the frontend and backend, including the new `verify-by-booking` endpoint that ensures payments are properly tracked and verified.

## Problem Solved
Previously, when users made payments through Paystack or Flutterwave, the payment status could get stuck at `PENDING` if:
1. The webhook callback was missed
2. The payment reference was lost
3. There were network issues during verification

## Solution Implemented

### 1. Backend Corrections

#### New Endpoint: `/api/payments/verify-by-booking`
**Purpose**: Verify payment using only the booking ID (auto-detects payment provider)

**Location**: `booking-backend/src/controllers/paymentController.ts`

**Request**:
```json
{
  "bookingId": "cmj1mzp670003ttxs0yx3qd8e"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment verified via Paystack",
  "data": {
    "payment": {
      "id": "payment_id",
      "status": "ESCROW_HELD",
      "method": "PAYSTACK",
      "amount": 510,
      "currency": "NGN"
    },
    "booking": {
      "id": "booking_id",
      "status": "PAID",
      "totalPrice": 510
    }
  }
}
```

**How It Works**:
1. Finds booking by ID and includes associated payment
2. Auto-detects payment provider from `payment.method` field (PAYSTACK or FLUTTERWAVE)
3. Retrieves stored `payment.reference` or `payment.providerTransactionId`
4. Calls appropriate provider verification service
5. Updates payment to `ESCROW_HELD` status
6. Calls `escrowService.holdFundsInEscrow()` to transfer funds to escrow
7. Updates booking status to `PAID`
8. Returns updated payment and booking data

#### Updated Response Format
Both `verifyPaymentByBooking` responses now include full payment and booking data:
- Previously: Simple status response
- Now: Complete `data.payment` and `data.booking` objects

### 2. Frontend Integration

#### Updated Payment Service (`src/services/payments.ts`)

**New Method**:
```typescript
verifyPaymentByBooking: async (
  data: VerifyByBookingRequest
): Promise<VerifyByBookingResponse> => {
  const response = await apiClient.post<{ 
    success: boolean; 
    message: string; 
    data?: { payment?: Payment; booking?: any } 
  }>(
    "/payments/verify-by-booking",
    data
  );

  return {
    success: response.data.success,
    message: response.data.message,
    payment: response.data.data?.payment,
    booking: response.data.data?.booking,
  };
}
```

**Fixed Initialization Methods**:
Both `initializePaystackPayment` and `initializeFlutterwavePayment` now properly access nested data:
```typescript
const responseData = response.data.data; // Access nested data
return {
  authorizationUrl: responseData.authorizationUrl,
  reference: responseData.reference,
  paymentId: responseData.paymentId,
  paymentStatus: responseData.paymentStatus,
};
```

#### Updated Payment Success Page (`src/app/booking/payment/success/page.tsx`)

**Enhanced Verification Flow**:
1. **Primary Flow**: Try verification with payment reference
   - If reference exists, call standard `verifyPaystackPayment` or `verifyFlutterwavePayment`
   
2. **Fallback #1**: If no reference but bookingId exists
   - Call `verifyPaymentByBooking` with bookingId
   
3. **Fallback #2**: If reference verification fails
   - Automatically retry with `verifyPaymentByBooking` using stored bookingId

**Key Features**:
- Supports both Paystack and Flutterwave metadata from localStorage
- Automatically cleans up stored metadata after verification
- Better error logging with console messages
- Graceful fallback to booking-based verification

#### Enhanced Payment Components

**PaystackCheckout.tsx & FlutterwaveCheckout.tsx**:
- Added comprehensive console logging at each step:
  - 🚀 Payment initialization start
  - ✅ Successful initialization with details
  - 💾 Payment metadata storage
  - 🔗 Redirect to provider
  - ❌ Error details if initialization fails
- Properly stores bookingId in localStorage metadata
- Better error messages for debugging

### 3. Complete Payment Flow

#### Step 1: User Initiates Payment
```
Frontend → POST /api/payments/initialize-paystack OR initialize-flutterwave
         ← Response: { authorizationUrl, reference, paymentId, bookingId }
         → Store metadata in localStorage
         → Redirect to provider authorization URL
```

**What Happens in Backend**:
1. Validates booking exists and is PENDING
2. Creates/updates Payment record with status=PENDING, method=PAYSTACK/FLUTTERWAVE
3. Calls Paystack/Flutterwave API to get authorization URL
4. Returns response with all necessary data

#### Step 2: User Completes Payment
```
User → Completes payment on Paystack/Flutterwave
Provider → Redirects to /booking/payment/success?reference=XXX&provider=paystack
```

#### Step 3: Payment Verification
```
Frontend → Loads success page
         → Retrieves stored metadata (bookingId, paymentId, reference)
         
Option A: Has reference
         → POST /api/payments/verify-paystack OR verify-flutterwave
         ← Response: { payment, booking }
         
Option B: No reference OR verification failed
         → POST /api/payments/verify-by-booking
         ← Response: { payment, booking }
         
         → Update UI with payment status
         → Redirect to booking confirmation
```

**What Happens in Backend**:
1. Finds payment by reference or bookingId
2. Calls provider's verification API
3. Validates payment was successful
4. Updates Payment: status=ESCROW_HELD, paidAt=now, providerId, metadata
5. Calls escrowService to hold funds in escrow
6. Updates Booking: status=PAID
7. Sends notifications and emails
8. Returns updated payment and booking data

### 4. Error Handling & Debugging

#### Frontend Logging
All payment operations now log to console:
- `🚀 Initializing [Provider] payment for booking: [bookingId]`
- `✅ [Provider] initialization response: { paymentId, reference, status }`
- `💾 Storing payment metadata: { reference, paymentId, bookingId }`
- `🔗 Redirecting to [Provider] authorization URL`
- `❌ [Provider] payment initialization failed: [error]`

#### Backend Logging
Payment controller logs key events:
- `✅ [Provider] payment initialized: { paymentId, reference, authorizationUrl }`
- `❌ [Provider] initialization error: { error, bookingId, paymentId }`
- `✅ Booking status updated to PAID: { bookingId, paymentId }`
- `❌ Payment verification by booking failed: { bookingId, provider, error }`

#### Common Issues & Solutions

**Issue 1**: Payment stuck at PENDING after successful payment
- **Check**: Browser console for error messages
- **Check**: Backend logs for verification errors
- **Solution**: Use verify-by-booking endpoint manually or refresh success page

**Issue 2**: "Payment record not found"
- **Cause**: Payment initialization failed but user completed payment on provider side
- **Check**: Backend logs during initialization
- **Solution**: Contact support with booking ID and payment reference

**Issue 3**: "Invalid token" when calling API
- **Cause**: JWT token expired or incorrect
- **Solution**: User needs to log in again to get fresh token

**Issue 4**: Missing payment reference after redirect
- **Cause**: localStorage cleared or different browser/device
- **Solution**: Verify-by-booking endpoint will work with just bookingId

### 5. Testing the Integration

#### Test Scenario 1: Normal Payment Flow
1. Create a booking
2. Initialize payment (Paystack or Flutterwave)
3. Complete payment on provider website
4. Verify redirect to success page
5. Confirm booking status changes to PAID

#### Test Scenario 2: Fallback Verification
1. Create a booking
2. Initialize payment
3. Complete payment
4. Clear browser localStorage BEFORE redirect
5. Success page should use verify-by-booking fallback
6. Confirm booking status still changes to PAID

#### Test Scenario 3: Manual Verification
If payment is stuck, use this curl command:
```bash
curl -X POST "http://localhost:5050/api/payments/verify-by-booking" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "YOUR_BOOKING_ID"}'
```

### 6. Database Schema

**Payment Model**:
```prisma
model Payment {
  id                    String        @id @default(cuid())
  bookingId             String        @unique
  userId                String
  amount                Decimal
  currency              String        @default("NGN")
  method                PaymentMethod // PAYSTACK or FLUTTERWAVE
  status                PaymentStatus // PENDING, ESCROW_HELD, COMPLETED, etc.
  reference             String?       @unique
  providerTransactionId String?
  providerId            String?
  paidAt                DateTime?
  metadata              Json?
  // ... other fields
}
```

**Key Enums**:
```prisma
enum PaymentMethod {
  PAYSTACK
  FLUTTERWAVE
}

enum PaymentStatus {
  INITIATED
  PENDING
  ESCROW_HELD
  ROOM_FEE_SPLIT_RELEASED
  COMPLETED
  FAILED
  REFUNDED_TO_CUSTOMER
  PARTIAL_PAYOUT_REALTOR
  RELEASED_TO_REALTOR
}
```

### 7. API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/payments/initialize-paystack` | POST | Start Paystack payment | Yes |
| `/api/payments/initialize-flutterwave` | POST | Start Flutterwave payment | Yes |
| `/api/payments/verify-paystack` | POST | Verify Paystack payment by reference | Yes |
| `/api/payments/verify-flutterwave` | POST | Verify Flutterwave payment by reference | Yes |
| `/api/payments/verify-by-booking` | POST | Verify payment by booking ID (NEW) | Yes |

### 8. Environment Variables Required

**Backend** (`.env`):
```env
# Payment Providers
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx

# Frontend URL for callbacks
FRONTEND_URL=http://localhost:3000

# JWT for authentication
JWT_SECRET=your_jwt_secret_here
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5050/api
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
```

## Conclusion

The payment flow is now fully integrated with:
✅ Proper frontend-backend communication
✅ Automatic payment record creation during initialization
✅ Multiple verification methods (by reference or booking ID)
✅ Fallback mechanisms for reliability
✅ Comprehensive error logging
✅ Proper data structure handling
✅ Status updates reflected in both payment and booking records

All payments made through the frontend will now be properly tracked, verified, and updated in the database.
