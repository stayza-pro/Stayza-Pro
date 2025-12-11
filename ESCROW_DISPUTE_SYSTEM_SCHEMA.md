# Escrow & Dispute System - Schema Implementation

## Overview
Complete database schema for the escrow and dispute system has been implemented. This document outlines the changes made and the next steps required for full implementation.

## Database Migration
- **Migration Name**: `20251210190831_add_escrow_dispute_system`
- **Status**: ✅ Applied successfully
- **Prisma Client**: ✅ Regenerated

## Schema Changes

### 1. Booking Model Updates
Added fee breakdown and dispute tracking fields:

```prisma
model Booking {
  // Fee breakdown (for transparency)
  roomFee         Decimal @default(0) @db.Decimal(10, 2)
  cleaningFee     Decimal @default(0) @db.Decimal(10, 2)
  securityDeposit Decimal @default(0) @db.Decimal(10, 2)
  serviceFee      Decimal @default(0) @db.Decimal(10, 2) // 2% of (roomFee + cleaningFee)
  platformFee     Decimal @default(0) @db.Decimal(10, 2) // 10% of roomFee (deducted at release)

  // Actual check-in/out timestamps
  checkInTime  DateTime? // Actual check-in timestamp
  checkOutTime DateTime? // Actual check-out timestamp

  // Dispute timers
  disputeWindowClosesAt  DateTime? // 1 hour after check-in
  realtorDisputeClosesAt DateTime? // 2 hours after checkout
  userDisputeOpened      Boolean   @default(false)
  realtorDisputeOpened   Boolean   @default(false)

  // Relations
  disputes       Dispute[]
  escrowEvents   EscrowEvent[]
}
```

### 2. Payment Model Updates
Added payment breakdown and escrow tracking:

```prisma
model Payment {
  providerId String? // "PAYSTACK" or "FLUTTERWAVE"
  status     PaymentStatus @default(INITIATED)

  // Payment breakdown
  roomFeeAmount         Decimal @default(0) @db.Decimal(10, 2)
  cleaningFeeAmount     Decimal @default(0) @db.Decimal(10, 2)
  securityDepositAmount Decimal @default(0) @db.Decimal(10, 2)
  serviceFeeAmount      Decimal @default(0) @db.Decimal(10, 2)
  platformFeeAmount     Decimal @default(0) @db.Decimal(10, 2)

  // Escrow tracking
  roomFeeInEscrow   Boolean   @default(false)
  depositInEscrow   Boolean   @default(false)
  roomFeeReleasedAt DateTime?
  depositReleasedAt DateTime?

  // Payout tracking
  cleaningFeePaidOut  Boolean @default(false)
  serviceFeeCollected Boolean @default(false)
  roomFeeSplitDone    Boolean @default(false)
  depositRefunded     Boolean @default(false)
}
```

### 3. New Dispute Model

```prisma
model Dispute {
  id              String         @id @default(cuid())
  bookingId       String
  disputeType     DisputeType
  status          DisputeStatus  @default(OPEN)
  openedBy        String // userId
  openedAt        DateTime       @default(now())
  closedAt        DateTime?
  
  // Outcome
  outcome         String? // Description of resolution
  agreedAmount    Decimal? @db.Decimal(10, 2) // If negotiated settlement
  
  // Evidence
  evidence        Json? // Array of photo/video URLs with metadata
  
  // Conversation
  messages        Json? // Array of dispute messages between parties
  
  // Admin escalation
  escalatedToAdmin Boolean       @default(false)
  adminId          String?
  adminNotes       String?
  adminResolvedAt  DateTime?
  
  booking          Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  opener           User          @relation("DisputeOpener", fields: [openedBy], references: [id])
  admin            User?         @relation("DisputeAdmin", fields: [adminId], references: [id])

  @@index([bookingId])
  @@index([status])
  @@index([disputeType])
  @@map("disputes")
}
```

### 4. New EscrowEvent Model

```prisma
model EscrowEvent {
  id                   String           @id @default(cuid())
  bookingId            String
  eventType            EscrowEventType
  amount               Decimal          @db.Decimal(10, 2)
  currency             String           @default("NGN")
  
  // Money movement
  fromParty            String? // "CUSTOMER" | "ESCROW" | "PLATFORM"
  toParty              String? // "REALTOR" | "CUSTOMER" | "PLATFORM" | "ESCROW"
  
  // Tracking
  executedAt           DateTime         @default(now())
  transactionReference String?
  providerResponse     Json?
  
  // Context
  notes                String?
  triggeredBy          String? // userId or "SYSTEM" for automated events
  
  booking              Booking          @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([eventType])
  @@map("escrow_events")
}
```

### 5. Updated Enums

#### BookingStatus
```prisma
enum BookingStatus {
  PENDING         // Initial state, waiting for payment
  PAID            // Payment confirmed, funds in escrow
  CONFIRMED       // Deprecated - use PAID instead
  CHECKED_IN      // User has checked in
  DISPUTE_OPENED  // Either user or realtor opened a dispute
  CHECKED_OUT     // User has checked out
  COMPLETED       // All funds released, booking finished
  CANCELLED       // Booking cancelled before check-in
}
```

#### PaymentStatus
```prisma
enum PaymentStatus {
  INITIATED                 // Payment process started
  PENDING                   // Waiting for payment provider confirmation (deprecated)
  ESCROW_HELD              // Room fee + security deposit held in escrow
  ROOM_FEE_SPLIT_RELEASED  // 90% to realtor, 10% to platform (after 1-hour dispute window)
  RELEASED_TO_REALTOR      // Full escrow released to realtor
  REFUNDED_TO_CUSTOMER     // Full refund to customer
  PARTIAL_PAYOUT_REALTOR   // Partial payout after dispute settlement
  COMPLETED                 // All transactions completed (deprecated - use specific states)
  FAILED                    // Payment failed
}
```

#### DisputeType (New)
```prisma
enum DisputeType {
  USER_DISPUTE    // Opened by user within 1 hour of check-in
  REALTOR_DISPUTE // Opened by realtor within 2 hours of check-out
}
```

#### DisputeStatus (New)
```prisma
enum DisputeStatus {
  OPEN              // Dispute just opened, waiting for other party response
  AWAITING_RESPONSE // Waiting for counterparty to respond
  NEGOTIATION       // Both parties are negotiating
  AGREED            // Parties reached agreement
  ADMIN_REVIEW      // Escalated to admin for resolution
  RESOLVED          // Dispute resolved (by agreement or admin)
  REJECTED          // Dispute rejected as invalid
}
```

#### EscrowEventType (New)
```prisma
enum EscrowEventType {
  HOLD_ROOM_FEE               // Room fee moved to escrow
  HOLD_SECURITY_DEPOSIT       // Security deposit moved to escrow
  RELEASE_ROOM_FEE_SPLIT      // 90% to realtor, 10% to platform
  RELEASE_DEPOSIT_TO_CUSTOMER // Security deposit returned to customer
  PAY_REALTOR_FROM_DEPOSIT    // Deduct from deposit, pay to realtor
  PAY_BALANCE_FROM_CUSTOMER   // Customer pays additional amount from new payment
  REFUND_ROOM_FEE_TO_CUSTOMER // Refund room fee from escrow to customer
  REFUND_PARTIAL_TO_CUSTOMER  // Partial refund to customer after dispute
  REFUND_PARTIAL_TO_REALTOR   // Partial payout to realtor after dispute
}
```

## Fee Structure Breakdown

### At Payment Time
1. **Cleaning Fee** → Immediate payout to Realtor
2. **Service Fee (2%)** → Immediate collection by Platform
   - Calculated as: `2% × (roomFee + cleaningFee)`
3. **Room Fee** → Held in Escrow
4. **Security Deposit** → Held in Escrow

### At Release Time (1 hour after check-in, if no dispute)
1. **Room Fee Split**:
   - 90% → Realtor
   - 10% → Platform
2. **Security Deposit** → Returned to Customer (if no damages)

## Business Logic Flow

### Normal Flow (No Disputes)
1. **Payment** → Status: INITIATED
2. **Payment Verified** → Status: ESCROW_HELD, Booking: PAID
   - Cleaning fee → Realtor (immediate)
   - Service fee → Platform (immediate)
   - Room fee → Escrow
   - Security deposit → Escrow
3. **Check-in** → Booking: CHECKED_IN
   - Set `disputeWindowClosesAt` = checkInTime + 1 hour
4. **1 hour after check-in** (automated)
   - If no user dispute: Release room fee split
   - Payment: ROOM_FEE_SPLIT_RELEASED
5. **Check-out** → Booking: CHECKED_OUT
   - Set `realtorDisputeClosesAt` = checkOutTime + 2 hours
6. **2 hours after check-out** (automated)
   - If no realtor dispute: Return security deposit
   - Payment: RELEASED_TO_REALTOR, Booking: COMPLETED

### Dispute Flow - User Opens (Within 1 hour of check-in)
1. User opens dispute with photo/video evidence
2. Booking: DISPUTE_OPENED, userDisputeOpened: true
3. Room fee split **paused** (held in escrow)
4. Realtor has 24 hours to respond
5. **Negotiation Phase**:
   - Parties can exchange messages
   - Can agree on settlement amount
   - If agreed: Execute split according to agreement
6. **If no agreement**: Admin escalation
7. **Admin Resolution**: Final decision on fund distribution

### Dispute Flow - Realtor Opens (Within 2 hours of check-out)
1. Realtor opens dispute with photo/video evidence of damages
2. Booking: DISPUTE_OPENED, realtorDisputeOpened: true
3. Security deposit release **paused**
4. Customer has 24 hours to respond
5. **Negotiation Phase** (same as above)
6. **Resolution**: Funds split according to agreement or admin decision

## Next Steps for Backend Implementation

### 1. Escrow Service (`src/services/escrowService.ts`)
- [ ] Calculate fee breakdown from booking
- [ ] Move funds to escrow after payment
- [ ] Schedule automated releases (1 hour user window, 2 hours realtor window)
- [ ] Execute fund releases to realtor/customer
- [ ] Create EscrowEvent records for all money movements

### 2. Dispute Controller (`src/controllers/disputeController.ts`)
- [ ] `POST /api/disputes/open` - Open a new dispute
- [ ] `POST /api/disputes/:id/respond` - Respond to a dispute
- [ ] `POST /api/disputes/:id/upload-evidence` - Upload photo/video proof
- [ ] `POST /api/disputes/:id/send-message` - Send message in dispute chat
- [ ] `POST /api/disputes/:id/agree` - Agree to settlement amount
- [ ] `POST /api/disputes/:id/escalate` - Escalate to admin
- [ ] `POST /api/disputes/:id/resolve` - Admin resolves dispute
- [ ] `GET /api/disputes/booking/:bookingId` - Get disputes for booking

### 3. Booking Controller Updates
- [ ] Update `createBooking` to calculate fee breakdown
- [ ] Add `checkIn` endpoint to set actual check-in time and dispute window
- [ ] Add `checkOut` endpoint to set actual check-out time and realtor dispute window
- [ ] Update status transitions to respect new PAID, CHECKED_IN, CHECKED_OUT states

### 4. Payment Controller Updates
- [ ] Split payment verification into immediate payouts + escrow holds
- [ ] Update payment breakdown tracking (roomFeeAmount, cleaningFeeAmount, etc.)
- [ ] Implement escrow hold logic after successful payment
- [ ] Create EscrowEvent records for initial holds

### 5. Automated Jobs (`src/jobs/`)
- [ ] `escrowReleaseJob.ts` - Check for bookings past 1-hour user dispute window
- [ ] `depositReleaseJob.ts` - Check for bookings past 2-hour realtor dispute window
- [ ] Run jobs every 5 minutes using node-cron or similar

### 6. Notification Updates
- [ ] Add dispute notification types (already in enum: DISPUTE_OPENED)
- [ ] Notify users when disputes are opened/responded to
- [ ] Notify when escrow is released
- [ ] Notify when deposits are returned

### 7. Admin Panel Updates
- [ ] Dispute management dashboard
- [ ] View dispute evidence (photos/videos)
- [ ] Review dispute chat messages
- [ ] Make final resolution decisions
- [ ] Override automated releases if needed

## Fee Calculation Examples

### Example 1: Simple Booking
- Room Fee: ₦50,000
- Cleaning Fee: ₦5,000
- Security Deposit: ₦10,000
- **Total**: ₦50,000 + ₦5,000 + ₦10,000 = ₦65,000

**Breakdown**:
- Service Fee (2%): ₦1,100 (2% of ₦55,000)
- **Customer Pays**: ₦66,100

**At Payment**:
- Cleaning Fee → Realtor: ₦5,000 ✅
- Service Fee → Platform: ₦1,100 ✅
- Room Fee → Escrow: ₦50,000 🔒
- Security Deposit → Escrow: ₦10,000 🔒

**1 Hour After Check-in** (if no dispute):
- Room Fee Split → Realtor: ₦45,000 (90%) ✅
- Room Fee Split → Platform: ₦5,000 (10%) ✅

**2 Hours After Check-out** (if no dispute):
- Security Deposit → Customer: ₦10,000 ✅

**Realtor Total**: ₦50,000 (₦5,000 + ₦45,000)
**Platform Total**: ₦6,100 (₦1,100 + ₦5,000)
**Customer Refund**: ₦10,000

### Example 2: With User Dispute (Property Not as Described)
Same as Example 1, but user opens dispute within 1 hour.

**Negotiated Settlement**: 50% refund
- Room Fee Refund → Customer: ₦25,000
- Room Fee Split → Realtor: ₦22,500 (90% of remaining ₦25,000)
- Room Fee Split → Platform: ₦2,500 (10% of remaining ₦25,000)
- Security Deposit → Customer: ₦10,000

**Realtor Total**: ₦27,500 (₦5,000 + ₦22,500)
**Platform Total**: ₦3,600 (₦1,100 + ₦2,500)
**Customer Refund**: ₦35,000 (₦25,000 + ₦10,000)

### Example 3: With Realtor Dispute (Damages)
Same as Example 1, but realtor opens dispute within 2 hours of checkout claiming ₦8,000 in damages.

**Negotiated Settlement**: ₦6,000 for damages
- Security Deposit to Realtor: ₦6,000
- Security Deposit Refund → Customer: ₦4,000

**Realtor Total**: ₦56,000 (₦5,000 + ₦45,000 + ₦6,000)
**Platform Total**: ₦6,100 (₦1,100 + ₦5,000)
**Customer Refund**: ₦4,000

## Testing Checklist

### Schema Testing
- [x] Migration applied successfully
- [x] Prisma client regenerated
- [ ] Can create bookings with fee breakdown
- [ ] Can create payments with breakdown tracking
- [ ] Can create disputes
- [ ] Can create escrow events
- [ ] Can query disputes by booking
- [ ] Can query escrow events by booking

### Business Logic Testing
- [ ] Fee calculation is correct
- [ ] Escrow holds after payment
- [ ] Cleaning fee paid out immediately
- [ ] Service fee collected immediately
- [ ] Room fee split after 1 hour (no dispute)
- [ ] Deposit returned after 2 hours (no dispute)
- [ ] Dispute pauses automated releases
- [ ] Admin can override releases
- [ ] Evidence upload works
- [ ] Dispute chat works
- [ ] Settlement agreement execution works

### Integration Testing
- [ ] End-to-end booking flow with escrow
- [ ] End-to-end user dispute flow
- [ ] End-to-end realtor dispute flow
- [ ] Payment provider integration (Paystack/Flutterwave)
- [ ] Notification triggers work
- [ ] Admin panel displays disputes correctly

## Important Notes

1. **Timer Precision**: Use scheduled jobs to check dispute windows every 5 minutes, not real-time triggers.

2. **Evidence Storage**: Photo/video evidence should be uploaded to cloud storage (e.g., Cloudinary, S3) and URLs stored in the `evidence` JSON field.

3. **Dispute Messages**: The `messages` JSON field should store an array of message objects with structure:
   ```json
   [
     {
       "id": "msg_123",
       "userId": "user_id",
       "message": "Text message",
       "timestamp": "2024-01-01T12:00:00Z",
       "attachments": ["url1", "url2"]
     }
   ]
   ```

4. **Money Movement**: All actual money transfers should create `EscrowEvent` records for audit trail.

5. **Backward Compatibility**: Keep supporting old `CONFIRMED` status for existing bookings, but new bookings use `PAID`.

6. **Security Deposit**: Always return to customer unless realtor proves damages with evidence.

7. **Admin Escalation**: Should be automatic after 48 hours of no resolution or either party can request.

## Migration Details

**File**: `prisma/migrations/20251210190831_add_escrow_dispute_system/migration.sql`

This migration includes:
- Added 5 fee breakdown columns to `bookings` table (with default 0)
- Added 4 dispute tracking columns to `bookings` table
- Added 2 check-in/out timestamp columns to `bookings` table
- Added `providerId` to `payments` table
- Added 5 payment breakdown columns to `payments` table (with default 0)
- Added 8 escrow/payout tracking columns to `payments` table
- Created `disputes` table with all fields
- Created `escrow_events` table with all fields
- Updated `BookingStatus` enum with new values
- Updated `PaymentStatus` enum with new values
- Created `DisputeType` enum
- Created `DisputeStatus` enum
- Created `EscrowEventType` enum
- Added foreign key constraints and indexes

**Warning**: The migration removed `REFUNDED` and `PARTIAL_REFUND` from `PaymentStatus` enum as they are replaced by more specific states.
