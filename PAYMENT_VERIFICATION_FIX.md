# Payment Verification Fix

## Problem
Booking ID `cmj1mzp670003ttxs0yx3qd8e` shows:
- ❌ Booking status: PENDING (should be PAID)
- ❌ Payment status: PENDING (should be ESCROW_HELD)
- ❌ Payment method displays "card" (should show PAYSTACK or FLUTTERWAVE)

## Root Cause
Payment verification didn't complete. This can happen when:
1. Frontend callback page didn't call the verify endpoint
2. Provider webhook didn't reach the backend
3. Missing/incorrect environment variables (API keys, webhook secrets)

## Solution
Added a new endpoint to manually verify payments by bookingId.

### API Endpoint

**POST** `/api/payments/verify-by-booking`

**Headers:**
```json
{
  "Authorization": "Bearer <your-jwt-token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "bookingId": "cmj1mzp670003ttxs0yx3qd8e"
}
```

**Success Response (200):**
```json
{
  "message": "Payment verified via Paystack",
  "bookingStatus": "PAID",
  "paymentStatus": "ESCROW_HELD",
  "provider": "PAYSTACK"
}
```

### How It Works
1. Looks up the payment record by bookingId
2. Auto-detects whether it's Paystack or Flutterwave from `payment.method`
3. Uses the stored `payment.reference` to verify with the provider
4. On success:
   - Updates `payment` with provider details and `paidAt` timestamp
   - Calls `escrowService.holdFundsInEscrow()` to set status to `ESCROW_HELD`
   - Updates `booking.status` to `PAID`
   - Logs "✅ Booking status updated to PAID"

### Testing with cURL

```bash
curl -X POST http://localhost:5000/api/payments/verify-by-booking \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "cmj1mzp670003ttxs0yx3qd8e"
  }'
```

### Testing with Postman
1. Create new POST request to `http://localhost:5000/api/payments/verify-by-booking`
2. Add Authorization header: `Bearer YOUR_JWT_TOKEN`
3. Body (raw JSON):
   ```json
   {
     "bookingId": "cmj1mzp670003ttxs0yx3qd8e"
   }
   ```
4. Send

### Prerequisites
Ensure these environment variables are set in `.env`:
```env
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_WEBHOOK_SECRET=xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx
```

### Verify The Fix
After calling the endpoint, check:

**Database Query:**
```sql
SELECT 
  b.id as bookingId,
  b.status as bookingStatus,
  p.method as paymentMethod,
  p.status as paymentStatus,
  p.providerId,
  p.paidAt
FROM "Booking" b
JOIN "Payment" p ON p."bookingId" = b.id
WHERE b.id = 'cmj1mzp670003ttxs0yx3qd8e';
```

**Expected Result:**
- `bookingStatus`: PAID
- `paymentStatus`: ESCROW_HELD
- `paymentMethod`: PAYSTACK or FLUTTERWAVE (not "card")
- `providerId`: "PAYSTACK" or "FLUTTERWAVE"
- `paidAt`: timestamp when verified

### Frontend Display Fix
When showing payment method to users, use `payment.method` (PAYSTACK/FLUTTERWAVE), not the provider's channel field which shows "card", "bank_transfer", etc.

```typescript
// ✅ Correct
<Text>Payment Method: {payment.method}</Text>  // Shows: PAYSTACK

// ❌ Wrong - shows channel used
<Text>Payment Method: {payment.metadata?.channel}</Text>  // Shows: card
```

### Logs
Check `booking-backend/logs/combined.log` for:
```
Verifying payment by bookingId { bookingId: 'cmj1mzp670003ttxs0yx3qd8e', provider: 'PAYSTACK', reference: 'xyz' }
✅ Booking status updated to PAID (Paystack) { bookingId: 'cmj1mzp670003ttxs0yx3qd8e', paymentId: 'abc' }
```

### Future Prevention
1. **Frontend**: Ensure callback pages call verify endpoints with the provider reference
2. **Webhooks**: Configure provider dashboards with correct webhook URLs and secrets
3. **Monitoring**: Set up alerts when bookings stay PENDING > 5 minutes after payment initialization

---

**Files Changed:**
- `src/controllers/paymentController.ts` - Added `verifyPaymentByBooking` controller
- `src/routes/paymentRoutes.ts` - Added `/verify-by-booking` route
