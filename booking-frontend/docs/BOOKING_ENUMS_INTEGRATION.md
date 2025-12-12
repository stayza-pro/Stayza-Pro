# Booking & Payment Enums Integration Guide

This guide explains how the backend Prisma schema enums are integrated into the frontend and how to use them effectively.

## Overview

The frontend now uses **exactly the same enum values** as the backend Prisma schema. This ensures type safety and consistency across the entire application.

## Available Enums

### 1. BookingStatus
Tracks the complete lifecycle of a booking from creation to completion.

```typescript
type BookingStatus =
  | "PENDING"         // Initial state, waiting for payment
  | "PAID"            // Payment confirmed, funds in escrow
  | "CONFIRMED"       // Deprecated - use PAID instead
  | "CHECKED_IN"      // User has checked in
  | "DISPUTE_OPENED"  // Either user or realtor opened a dispute
  | "CHECKED_OUT"     // User has checked out
  | "COMPLETED"       // All funds released, booking finished
  | "CANCELLED";      // Booking cancelled before check-in
```

**State Machine Flow:**
```
PENDING → PAID → CHECKED_IN → CHECKED_OUT → COMPLETED
           ↓         ↓
      CANCELLED  DISPUTE_OPENED → COMPLETED/CANCELLED
```

### 2. PaymentStatus
Tracks where money is at each stage of the booking lifecycle.

```typescript
type PaymentStatus =
  | "INITIATED"                    // Payment process started
  | "PENDING"                      // Waiting for payment provider (deprecated)
  | "ESCROW_HELD"                  // Funds held in escrow
  | "ROOM_FEE_SPLIT_RELEASED"      // 90% to realtor, 10% to platform
  | "RELEASED_TO_REALTOR"          // Full escrow released to realtor
  | "REFUNDED_TO_CUSTOMER"         // Full refund to customer
  | "PARTIAL_PAYOUT_REALTOR"       // Partial payout after dispute
  | "COMPLETED"                    // All transactions completed (deprecated)
  | "FAILED";                      // Payment failed
```

### 3. PayoutStatus
Tracks payout processing for realtors.

```typescript
type PayoutStatus =
  | "PENDING"      // Waiting for check-in
  | "READY"        // Ready to transfer
  | "PROCESSING"   // Transfer initiated
  | "COMPLETED"    // Successfully paid out
  | "FAILED";      // Payout failed
```

### 4. RefundTier
Determines refund percentages based on cancellation timing.

```typescript
type RefundTier =
  | "EARLY"   // 24+ hours before: 90% guest, 7% realtor, 3% platform
  | "MEDIUM"  // 12-24 hours: 70% guest, 20% realtor, 10% platform
  | "LATE"    // 0-12 hours: 0% guest, 80% realtor, 20% platform
  | "NONE";   // After check-in: No refund
```

## Using the Utilities

### Import Path
```typescript
import {
  formatBookingStatus,
  formatPaymentStatus,
  getBookingStatusColor,
  getPaymentStatusColor,
  isValidBookingStatusTransition,
  canCancelBooking,
  calculateRefundTier,
} from "@/utils/bookingEnums";
```

### Format Status for Display
```typescript
const displayText = formatBookingStatus("CHECKED_IN");
// Returns: "Checked In"

const paymentText = formatPaymentStatus("ESCROW_HELD");
// Returns: "In Escrow"
```

### Get Status Colors
```typescript
const colors = getBookingStatusColor("PAID");
// Returns: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" }

// Use in JSX:
<span className={`${colors.bg} ${colors.text} ${colors.border} px-3 py-1 rounded`}>
  {formatBookingStatus(status)}
</span>
```

### Validate State Transitions
```typescript
const isValid = isValidBookingStatusTransition("PAID", "CHECKED_IN");
// Returns: true

const isValid2 = isValidBookingStatusTransition("PENDING", "COMPLETED");
// Returns: false (must go through intermediate states)
```

### Check Cancellation Eligibility
```typescript
const canCancel = canCancelBooking("PAID");
// Returns: true

const canCancel2 = canCancelBooking("CHECKED_IN");
// Returns: false (too late to cancel)
```

### Calculate Refund Tier
```typescript
const hoursUntilCheckIn = 30; // 30 hours until check-in
const tier = calculateRefundTier(hoursUntilCheckIn);
// Returns: "EARLY"

const amounts = calculateRefundAmounts(10000, tier);
// Returns: { guestRefund: 9000, realtorPayout: 700, platformFee: 300 }
```

## Using the Components

### BookingStatusBadge
Displays a formatted badge with icon and color.

```typescript
import { BookingStatusBadge } from "@/components/booking";

<BookingStatusBadge 
  status={booking.status} 
  size="md"
  showIcon={true}
/>
```

**Props:**
- `status`: BookingStatus (required)
- `size`: "sm" | "md" | "lg" (default: "md")
- `showIcon`: boolean (default: true)

### PaymentStatusBadge
Displays payment status badge.

```typescript
import { PaymentStatusBadge } from "@/components/booking";

<PaymentStatusBadge 
  status={booking.paymentStatus}
  size="sm"
/>
```

### BookingStatusCard
Displays comprehensive status summary card.

```typescript
import { BookingStatusCard } from "@/components/booking";

<BookingStatusCard
  bookingStatus={booking.status}
  paymentStatus={booking.paymentStatus}
  className="mb-6"
/>
```

**Features:**
- Auto-generates user-friendly title and description
- Shows both booking and payment status badges
- Color-coded based on current state
- Responsive design

## Real-World Examples

### Example 1: Booking Confirmation Page
```typescript
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/booking";

function ConfirmationPage({ booking }) {
  return (
    <div>
      <div className="flex gap-2">
        <BookingStatusBadge status={booking.status} />
        <PaymentStatusBadge status={booking.paymentStatus} />
      </div>
      
      <p>
        {formatBookingStatus(booking.status)} - {formatPaymentStatus(booking.paymentStatus)}
      </p>
    </div>
  );
}
```

### Example 2: Admin Dashboard with State Validation
```typescript
import { isValidBookingStatusTransition, formatBookingStatus } from "@/utils/bookingEnums";

function AdminBookingActions({ booking }) {
  const handleStatusChange = async (newStatus: BookingStatus) => {
    // Validate transition before API call
    if (!isValidBookingStatusTransition(booking.status, newStatus)) {
      toast.error(`Cannot transition from ${formatBookingStatus(booking.status)} to ${formatBookingStatus(newStatus)}`);
      return;
    }
    
    await updateBookingStatus(booking.id, newStatus);
  };
  
  return (
    <select onChange={(e) => handleStatusChange(e.target.value as BookingStatus)}>
      {/* Only show valid next states */}
      {BOOKING_STATUS_TRANSITIONS[booking.status].map(status => (
        <option key={status} value={status}>
          {formatBookingStatus(status)}
        </option>
      ))}
    </select>
  );
}
```

### Example 3: Refund Calculator
```typescript
import { calculateRefundTier, calculateRefundAmounts, getRefundTierDescription } from "@/utils/bookingEnums";

function RefundCalculator({ booking }) {
  const checkInDate = new Date(booking.checkInDate);
  const now = new Date();
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  const tier = calculateRefundTier(hoursUntilCheckIn);
  const amounts = calculateRefundAmounts(booking.totalPrice, tier);
  
  return (
    <div>
      <p>{getRefundTierDescription(tier)}</p>
      <ul>
        <li>Guest Refund: ${amounts.guestRefund.toFixed(2)}</li>
        <li>Realtor Payout: ${amounts.realtorPayout.toFixed(2)}</li>
        <li>Platform Fee: ${amounts.platformFee.toFixed(2)}</li>
      </ul>
    </div>
  );
}
```

### Example 4: Payment Flow Status Tracker
```typescript
import { isPaymentInEscrow, isPaymentCompleted, formatPaymentStatus } from "@/utils/bookingEnums";

function PaymentTracker({ payment }) {
  if (isPaymentCompleted(payment.status)) {
    return <div className="text-green-600">✓ Payment Complete</div>;
  }
  
  if (isPaymentInEscrow(payment.status)) {
    return (
      <div className="text-blue-600">
        🔒 Funds in Escrow - {formatPaymentStatus(payment.status)}
      </div>
    );
  }
  
  return <div className="text-yellow-600">⏳ Processing...</div>;
}
```

## Type Safety Benefits

### Before (Inconsistent)
```typescript
// Frontend had different enum values than backend
type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
// Backend had: "ESCROW_HELD" | "ROOM_FEE_SPLIT_RELEASED" | "REFUNDED_TO_CUSTOMER"

// This caused runtime errors!
if (payment.status === "REFUNDED") { // ❌ Wrong enum value!
  // ...
}
```

### After (Type Safe)
```typescript
// Frontend matches backend exactly
import { PaymentStatus } from "@/types";

if (payment.status === "REFUNDED_TO_CUSTOMER") { // ✅ Correct!
  // TypeScript validates this at compile time
}
```

## State Machine Diagram

```
┌─────────┐
│ PENDING │ (Waiting for payment)
└────┬────┘
     │
     ├─────► CANCELLED
     │
     ▼
┌────────┐
│  PAID  │ (Funds in escrow)
└────┬───┘
     │
     ├─────► CANCELLED (with refund)
     │
     ▼
┌────────────┐
│ CHECKED_IN │ (Guest at property)
└─────┬──────┘
      │
      ├─────► DISPUTE_OPENED ──┬───► COMPLETED
      │                        └───► CANCELLED
      ▼
┌─────────────┐
│ CHECKED_OUT │ (Guest left)
└──────┬──────┘
       │
       ▼
┌───────────┐
│ COMPLETED │ (Final state)
└───────────┘
```

## Best Practices

1. **Always use utility functions** instead of hardcoding status strings
2. **Validate state transitions** before making API calls
3. **Use the status badge components** for consistent UI
4. **Import types from @/types** for TypeScript safety
5. **Check terminal states** before allowing modifications
6. **Use refund tier calculator** for accurate cancellation refunds

## Migration Notes

If you have existing code using old enum values, update them:

| Old Value | New Value |
|-----------|-----------|
| `"REFUNDED"` | `"REFUNDED_TO_CUSTOMER"` |
| `"PARTIALLY_REFUNDED"` | `"PARTIAL_PAYOUT_REALTOR"` |
| Simple status checks | Use `isPaymentInEscrow()`, `canCancelBooking()` utils |

## Testing

```typescript
import { isValidBookingStatusTransition } from "@/utils/bookingEnums";

describe("Booking Status Transitions", () => {
  it("should allow PENDING to PAID transition", () => {
    expect(isValidBookingStatusTransition("PENDING", "PAID")).toBe(true);
  });
  
  it("should not allow PENDING to COMPLETED transition", () => {
    expect(isValidBookingStatusTransition("PENDING", "COMPLETED")).toBe(false);
  });
});
```

## Support

For questions or issues with enum integration:
- Check backend schema: `booking-backend/prisma/schema.prisma`
- Review utilities: `booking-frontend/src/utils/bookingEnums.ts`
- See components: `booking-frontend/src/components/booking/BookingStatusBadge.tsx`
