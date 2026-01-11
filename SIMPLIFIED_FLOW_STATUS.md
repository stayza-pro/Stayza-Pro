# COMPLETE BOOKING, ESCROW, MONEY RELEASE & REFUND FLOWS

## 📋 TABLE OF CONTENTS

1. [Enums & Core Model](#enums--core-model)
2. [Money Ownership Rules](#money-ownership-rules)
3. [Complete Booking Flow](#complete-booking-flow)
4. [Money Release Timelines](#money-release-timelines)
5. [Cancellation & Refund Flow](#cancellation--refund-flow)
6. [Dispute System](#dispute-system)
7. [State Machine Reference](#state-machine-reference)
8. [Complete Flow Examples](#complete-flow-examples)

---

## 🏗️ ENUMS & CORE MODEL

### BookingStatus (Business State)

```typescript
enum BookingStatus {
  PENDING      // Awaiting payment
  ACTIVE       // Payment successful, booking active
  DISPUTED     // Active dispute blocking money release
  COMPLETED    // All money settled, terminal state
  CANCELLED    // Cancelled before check-in, terminal state
}
```

**State Flow:**
```
PENDING → ACTIVE → COMPLETED
    ↓       ↓         ↓
    ↓    DISPUTED    ↓
    ↓       ↓         ↓
    └─→ CANCELLED ←─┘
```

---

### StayStatus (Physical State)

```typescript
enum StayStatus {
  NOT_STARTED  // Guest has not checked in yet
  CHECKED_IN   // Guest is currently staying at property
  CHECKED_OUT  // Guest has left the property
}
```

**State Flow (Monotonic):**
```
NOT_STARTED → CHECKED_IN → CHECKED_OUT
```

**Critical Rule:** StayStatus only moves forward, never backwards.

---

### PaymentStatus (Financial State)

```typescript
enum PaymentStatus {
  INITIATED           // Payment process started
  HELD                // Money held in escrow (room + deposit)
  PARTIALLY_RELEASED  // Room fee released, deposit still in escrow
  SETTLED             // All money distributed (deposit released)
  REFUNDED            // Money refunded to guest after cancellation
  FAILED              // Payment transaction failed
}
```

**State Flow:**
```
INITIATED → HELD → PARTIALLY_RELEASED → SETTLED
              ↓
          REFUNDED (cancellation)
              ↓
          FAILED (payment error)
```

---

### DisputeScope (Dispute Type)

```typescript
enum DisputeScope {
  ROOM_FEE  // Dispute about room quality/cleanliness
  DEPOSIT   // Dispute about damage/missing items
}
```

**Purpose:**
- **ROOM_FEE disputes** block room fee release
- **DEPOSIT disputes** block deposit release (room fee already released)
- Each dispute type gates different money flows

---

## 💰 MONEY OWNERSHIP RULES

### Single Source of Truth

| Component       | Amount Formula                    | Held By         | Refundable | Released When |
|-----------------|-----------------------------------|-----------------|------------|---------------|
| **Room Fee**    | `pricePerNight × nights`          | Escrow          | ✅ Yes     | 1 hour after check-in |
| **Security Deposit** | Set by realtor (optional)    | Escrow          | ✅ Yes     | 4 hours after checkout |
| **Cleaning Fee**| Set by realtor (optional)         | Realtor Wallet  | ❌ **NEVER** | Immediate on payment |
| **Service Fee** | 2% of (roomFee + cleaningFee)     | Platform Wallet | ❌ **NEVER** | Immediate on payment |

### 🚨 IMMUTABLE RULE: Cleaning & Service Fees

**Cleaning fee and service fee are NEVER refunded. PERIOD.**

This applies in ALL scenarios:
- ❌ Cancellation (any tier)
- ❌ Full refund disputes
- ❌ Major disputes
- ❌ Platform fault
- ❌ Realtor cancellation

**Why?**
- Once released to wallets, they **do not move**
- Simplifies accounting (no clawback logic needed)
- Clear expectations for realtors and platform

**Refundable Components Only:**
- Room Fee (tier-based before check-in, dispute-based after)
- Security Deposit (always 100% unless damage proven)

---

## 📅 COMPLETE BOOKING FLOW

### Phase 1: Booking Creation & Payment

```
1. Guest selects property + dates
   ↓
2. System calculates fees:
   - Room Fee = pricePerNight × numberOfNights
   - Cleaning Fee = set by realtor (optional)
   - Security Deposit = set by realtor (optional)
   - Service Fee = 2% of (roomFee + cleaningFee)
   - TOTAL = roomFee + cleaningFee + securityDeposit + serviceFee
   ↓
3. Booking created:
   - bookingStatus = PENDING
   - stayStatus = NOT_STARTED
   - paymentStatus = INITIATED
   ↓
4. Guest redirected to Paystack for payment
   ↓
5. Paystack webhook receives confirmation
   ↓
6. System updates:
   - bookingStatus: PENDING → ACTIVE
   - stayStatus: NOT_STARTED (no change)
   - paymentStatus: INITIATED → HELD
   ↓
7. Money distribution:
   ├─→ Room Fee → ESCROW
   ├─→ Security Deposit → ESCROW
   ├─→ Cleaning Fee → Realtor Wallet (IMMEDIATE, NEVER REFUNDABLE)
   └─→ Service Fee → Platform Wallet (IMMEDIATE, NEVER REFUNDABLE)
```

**Key Files:**
- [booking.routes.ts](booking-backend/src/routes/booking.routes.ts) - Booking creation
- [webhook.routes.ts](booking-backend/src/routes/webhook.routes.ts) - Paystack webhook
- [escrowService.ts](booking-backend/src/services/escrowService.ts) - Escrow management
### Phase 2: Check-In Confirmation

```
CHECK-IN OPTIONS (2 ways):

Option A: Realtor Confirms Check-In
   - Realtor clicks "Confirm Check-In" in dashboard
   - Can only happen at or after official checkInTime
   - Immediate confirmation
   
Option B: Auto-Confirmation Fallback
   - Cron job runs every 5 minutes (checkinFallbackJob)
   - Auto-confirms 30 minutes after official checkInTime
   - Prevents bookings stuck in NOT_STARTED

❌ Guest Manual Check-In: DISABLED
   - Removed to prevent early check-in exploits

AFTER CHECK-IN CONFIRMATION:
✓ bookingStatus = ACTIVE (no change)
✓ stayStatus = NOT_STARTED → CHECKED_IN
✓ paymentStatus = HELD (no change yet)
✓ checkinConfirmedAt = NOW
✓ disputeWindowClosesAt = NOW + 1 hour
✓ roomFeeReleaseEligibleAt = NOW + 1 hour
```

**Guest Dispute Window Opens:**
- Duration: 1 hour after check-in
- Guest can raise ROOM_FEE disputes
- Blocks room fee release until resolved

**Key Files:**
- [checkinService.ts](booking-backend/src/services/checkinService.ts) - Check-in logic
- [checkinFallbackJob.ts](booking-backend/src/jobs/checkinFallbackJob.ts) - Auto check-in

---

### Phase 3: Check-Out Confirmation

```
CHECK-OUT OPTIONS (2 ways):

Option A: Guest or Realtor Confirms Check-Out
   - Guest clicks "Check Out" OR Realtor confirms
   - Can only happen if stayStatus = CHECKED_IN
   - Immediate checkout
   
Option B: Auto-Checkout (Future)
   - Planned: Auto-checkout 1 hour after checkOutTime
   - Not yet implemented

AFTER CHECK-OUT CONFIRMATION:
✓ bookingStatus = ACTIVE (stays ACTIVE until deposit released)
✓ stayStatus = CHECKED_IN → CHECKED_OUT
✓ paymentStatus = PARTIALLY_RELEASED (if room fee already released)
✓ checkOutTime = NOW
✓ depositRefundEligibleAt = NOW + 4 hours
✓ realtorDisputeClosesAt = NOW + 4 hours
```

**Realtor Dispute Window Opens:**
- Duration: 4 hours after checkout
- Realtor can raise DEPOSIT disputes (damage claims)
- Blocks deposit release until resolved

**Key Files:**
- [booking.routes.ts](booking-backend/src/routes/booking.routes.ts) - Checkout endpoints

---

### Phase 4: Booking Completion

```
COMPLETION TRIGGERS:

1. stayStatus = CHECKED_OUT (guest has left)
2. Security deposit released (4 hours after checkout)
3. No active disputes
4. depositRefundJob executes

SYSTEM ACTIONS:
- bookingStatus: ACTIVE → COMPLETED
- stayStatus: CHECKED_OUT (no change)
- paymentStatus: PARTIALLY_RELEASED → SETTLED
- Booking is now immutable (terminal state)
```

**Key Files:**
- [depositRefundJob.ts](booking-backend/src/jobs/depositRefundJob.ts) - Marks COMPLETED

---

## ⏰ MONEY RELEASE TIMELINES

### Complete Timeline Visualization

```
Payment Success
    ↓
    ├─→ Cleaning Fee → Realtor Wallet (IMMEDIATE, NEVER REFUNDABLE)
    ├─→ Service Fee → Platform Wallet (IMMEDIATE, NEVER REFUNDABLE)
    └─→ Room Fee + Deposit → ESCROW
            ↓
        Check-In Confirmed
            ↓
        ⏱️  Wait 1 hour (Guest Dispute Window - ROOM_FEE scope)
            ↓
        Room Fee Released (90% → Realtor, 10% → Platform)
        paymentStatus: HELD → PARTIALLY_RELEASED
            ↓
        Check-Out Confirmed
            ↓
        ⏱️  Wait 4 hours (Realtor Dispute Window - DEPOSIT scope)
            ↓
        Security Deposit Released (100% → Guest Refund)
        paymentStatus: PARTIALLY_RELEASED → SETTLED
            ↓
        bookingStatus: ACTIVE → COMPLETED
```

---

### Room Fee Release (1 Hour After Check-In)

**Trigger:** `roomFeeReleaseJob.ts` runs every 5 minutes

**Eligibility Check:**
```typescript
WHERE {
  bookingStatus: ACTIVE
  stayStatus: IN [CHECKED_IN, CHECKED_OUT]
  checkinConfirmedAt: NOT NULL
  roomFeeReleaseEligibleAt: <= NOW
  payment.roomFeeSplitDone: false
  NO active disputes with scope = ROOM_FEE
}
```

**Release Split:**
```
Room Fee Total: ₦100,000 (example)
├─→ 90% (₦90,000) → Realtor Subaccount
└─→ 10% (₦10,000) → Platform Commission
```

**Database Updates:**
```typescript
payment.update({
  roomFeeSplitDone: true,
  roomFeeSplitRealtorAmount: 90000,
  roomFeeSplitPlatformAmount: 10000,
  roomFeeSplitReleaseReference: "ROOM_FEE_SPLIT_xxx",
  roomFeeReleasedAt: NOW,
  status: "PARTIALLY_RELEASED"
});
```

**Key Files:**
- [roomFeeReleaseJob.ts](booking-backend/src/jobs/roomFeeReleaseJob.ts)
- Runs every 5 minutes
- Processes up to 50 bookings per batch

---

### Security Deposit Release (4 Hours After Check-Out)

**Trigger:** `depositRefundJob.ts` runs every 5 minutes

**Eligibility Check:**
```typescript
WHERE {
  bookingStatus: ACTIVE
  stayStatus: CHECKED_OUT
  checkOutTime: NOT NULL
  depositRefundEligibleAt: <= NOW
  payment.depositRefunded: false
  NO active disputes with scope = DEPOSIT
}
```

**Release Logic:**
```
IF no damage disputes:
  → 100% to guest
  
IF damage dispute resolved with approved amount:
  → Deducted amount to realtor
  → Remaining amount to guest

Example:
  Deposit: ₦50,000
  Damage approved: ₦20,000
  ├─→ ₦20,000 → Realtor
  └─→ ₦30,000 → Guest refund
```

**Database Updates:**
```typescript
payment.update({
  depositRefunded: true,
  depositPartialRefundAmount: 30000, // if applicable
  depositPartialRefundReference: "DEPOSIT_REFUND_xxx",
  depositReleasedAt: NOW,
  status: "SETTLED"
});

booking.update({
  status: "COMPLETED" // ONLY place this transition happens
});
```

**Key Files:**
- [depositRefundJob.ts](booking-backend/src/jobs/depositRefundJob.ts)
- Runs every 5 minutes
- Marks booking as COMPLETED

---

## 🔄 CANCELLATION & REFUND FLOW

### 🚨 CRITICAL RULES

**1. Cancellation Window:**
```typescript
// Can only cancel when:
stayStatus === "NOT_STARTED" && 
bookingStatus === "ACTIVE" &&
NO active disputes
```

**2. Refund Calculation Base:**
```typescript
// Refund tiers apply ONLY to Room Fee
RefundableBase = roomFee
SecurityDeposit = always 100% refunded

// NEVER refunded (already in wallets):
CleaningFee = NEVER REFUNDABLE
ServiceFee = NEVER REFUNDABLE
```

**3. After Check-In:**
- ❌ Cancellation blocked
- ✅ Use dispute system instead

---

### Refund Tier System

**Tiers are calculated based on hours until checkInTime:**

| Tier   | Hours Until Check-In | Guest Refund | Realtor Comp | Platform Keeps |
|--------|---------------------|--------------|--------------|----------------|
| EARLY  | ≥ 24 hours          | 90% of room  | 7% of room   | 3% of room     |
| MEDIUM | 12-24 hours         | 70% of room  | 20% of room  | 10% of room    |
| LATE   | 0-12 hours          | 0% of room   | 80% of room  | 20% of room    |

**Security Deposit:** Always 100% refunded to guest (all tiers)

---

### Cancellation Process Flow

```
STEP 1: Validate Eligibility
├─→ Check: stayStatus === NOT_STARTED
├─→ Check: bookingStatus === ACTIVE
└─→ Check: No active disputes

STEP 2: Calculate Time Until Check-In
└─→ hoursUntil = (checkInTime - NOW) / 3600

STEP 3: Determine Refund Tier
├─→ ≥24 hours → EARLY
├─→ 12-24 hours → MEDIUM
└─→ 0-12 hours → LATE

STEP 4: Calculate Refund Amount
└─→ Apply tier percentage to ROOM FEE ONLY

STEP 5: Execute Refund
├─→ Paystack API: Refund guest (room fee % + deposit)
├─→ Credit realtor wallet with compensation from escrow
└─→ Credit platform wallet with retention from escrow

STEP 6: Update States
├─→ bookingStatus: ACTIVE → CANCELLED
├─→ stayStatus: NOT_STARTED (no change)
├─→ paymentStatus: HELD → REFUNDED
└─→ Create audit trail

STEP 7: Send Notifications
├─→ Email guest: Refund confirmation
├─→ Email realtor: Cancellation notice + compensation
└─→ Update booking history
```

---

### Refund Calculation Examples

#### Example 1: EARLY Cancellation (≥24 hours)

```
Original Payment: ₦110,000
├─ Room Fee: ₦100,000 (in escrow)
├─ Security Deposit: ₦3,000 (in escrow)
├─ Cleaning Fee: ₦5,000 (in realtor wallet - NEVER REFUNDED)
└─ Service Fee: ₦2,000 (in platform wallet - NEVER REFUNDED)

EARLY Tier (90% of room fee):
├─→ Guest Refund:
│   ├─ Room Fee: ₦90,000 (90% of ₦100,000)
│   ├─ Deposit: ₦3,000 (100%)
│   └─ Total: ₦93,000
│
├─→ Realtor Compensation (from escrow):
│   ├─ From room fee: ₦7,000 (7% of ₦100,000)
│   └─ Already has cleaning fee: ₦5,000
│   Total realtor receives: ₦12,000
│
└─→ Platform Keeps (from escrow):
    ├─ From room fee: ₦3,000 (3% of ₦100,000)
    └─ Already has service fee: ₦2,000
    Total platform receives: ₦5,000

VERIFICATION:
₦93,000 (guest) + ₦7,000 (realtor) + ₦3,000 (platform) = ₦103,000 (escrow) ✓
Total distributed: ₦93,000 + ₦12,000 + ₦5,000 = ₦110,000 ✓
```

#### Example 2: MEDIUM Cancellation (12-24 hours)

```
Original Payment: ₦110,000
Room Fee: ₦100,000 | Deposit: ₦3,000

MEDIUM Tier (70% of room fee):
├─→ Guest Refund:
│   ├─ Room Fee: ₦70,000 (70% of ₦100,000)
│   ├─ Deposit: ₦3,000 (100%)
│   └─ Total: ₦73,000
│
├─→ Realtor Compensation:
│   ├─ From escrow: ₦20,000 (20% of ₦100,000)
│   └─ Already has cleaning: ₦5,000
│   Total: ₦25,000
│
└─→ Platform Keeps:
    ├─ From escrow: ₦10,000 (10% of ₦100,000)
    └─ Already has service: ₦2,000
    Total: ₦12,000

VERIFICATION:
₦73,000 + ₦20,000 + ₦10,000 = ₦103,000 (escrow) ✓
```

#### Example 3: LATE Cancellation (0-12 hours)

```
Original Payment: ₦110,000
Room Fee: ₦100,000 | Deposit: ₦3,000

LATE Tier (0% of room fee):
├─→ Guest Refund:
│   ├─ Room Fee: ₦0 (0% of ₦100,000)
│   ├─ Deposit: ₦3,000 (100%)
│   └─ Total: ₦3,000
│
├─→ Realtor Compensation:
│   ├─ From escrow: ₦80,000 (80% of ₦100,000)
│   └─ Already has cleaning: ₦5,000
│   Total: ₦85,000
│
└─→ Platform Keeps:
    ├─ From escrow: ₦20,000 (20% of ₦100,000)
    └─ Already has service: ₦2,000
    Total: ₦22,000

VERIFICATION:
₦3,000 + ₦80,000 + ₦20,000 = ₦103,000 (escrow) ✓
```

---

### Cancellation Edge Cases

**1. Cannot Cancel After Check-In**
```typescript
if (booking.stayStatus !== "NOT_STARTED") {
  throw new AppError("Cannot cancel after check-in. Use dispute system.", 400);
}
```

**2. Active Disputes Block Cancellation**
```typescript
if (booking.bookingStatus === "DISPUTED") {
  throw new AppError("Resolve active disputes before cancelling.", 400);
}
```

**3. Pending Bookings (Unpaid)**
```typescript
if (booking.bookingStatus === "PENDING") {
  // Can cancel without refund (no payment made)
  booking.status = "CANCELLED";
  // No refund processing needed
}
```

**4. Auto-Cancel Unpaid Bookings**
```typescript
// unpaidBookingCron.ts runs every 5 minutes
if (booking.status === "PENDING" && createdAt + 30_minutes < NOW) {
  booking.status = "CANCELLED";
}
```

**Key Files:**
- [refund.ts](booking-backend/src/services/refund.ts) - Refund calculations
- [booking.routes.ts](booking-backend/src/routes/booking.routes.ts) - Cancel endpoints
- [unpaidBookingCron.ts](booking-backend/src/jobs/unpaidBookingCron.ts) - Auto-cancel

---

## ⚠️ DISPUTE SYSTEM

### Dispute Types & Scopes

```typescript
enum DisputeScope {
  ROOM_FEE  // Guest disputes room quality during 1-hour window
  DEPOSIT   // Realtor disputes damages during 4-hour window
}
```

**Why Scope Matters:**
- Different disputes gate different money flows
- ROOM_FEE disputes don't affect deposit release
- DEPOSIT disputes don't affect room fee (already released)

---

### Guest Disputes (ROOM_FEE Scope)

**When:** During 1-hour window after check-in

**Dispute Window:**
```
Check-In Confirmed
    ↓
    ⏱️  1-HOUR WINDOW OPENS
    ↓
    Guest can raise disputes:
    ├─→ "Room not as described"
    ├─→ "Cleanliness issues"
    ├─→ "Safety concerns"
    └─→ "Amenities missing"
    ↓
    IF dispute opened:
      bookingStatus: ACTIVE → DISPUTED
      disputeScope: ROOM_FEE
      → Room fee release BLOCKED
      → Admin review required
    ↓
    ⏱️  WINDOW CLOSES (if no disputes)
    ↓
    IF no disputes:
      → roomFeeReleaseJob proceeds
      → 90%/10% split released
```

**Resolution Outcomes:**

**1. Minor Issue (Partial Refund):**
```typescript
bookingStatus: DISPUTED → ACTIVE
paymentStatus: HELD → PARTIALLY_RELEASED

Actions:
1. Refund X% of room fee to guest (via Paystack)
2. Release remaining (100-X)% as 90/10 split
3. Room fee becomes final
4. Stay continues normally
```

**2. Major Issue (Full Refund):**
```typescript
bookingStatus: DISPUTED → CANCELLED
stayStatus: CHECKED_IN → NOT_STARTED (admin override)
paymentStatus: HELD → REFUNDED

Actions:
1. Refund 100% room fee to guest
2. Refund 100% deposit to guest
3. Cleaning & service fees STAY PUT (never refunded)
4. Guest must vacate immediately
```

**3. Dismissed:**
```typescript
bookingStatus: DISPUTED → ACTIVE
paymentStatus: HELD → PARTIALLY_RELEASED

Actions:
1. Release room fee normally (90/10 split)
2. No refund to guest
3. Stay continues
```

---

### Realtor Disputes (DEPOSIT Scope)

**When:** During 4-hour window after checkout

**Dispute Window:**
```
Check-Out Confirmed
    ↓
    ⏱️  4-HOUR WINDOW OPENS
    ↓
    Realtor can claim damages:
    ├─→ "Property damage"
    ├─→ "Missing items"
    ├─→ "Extra cleaning required"
    └─→ "Unauthorized guests"
    ↓
    IF damage claim raised:
      bookingStatus: ACTIVE → DISPUTED
      disputeScope: DEPOSIT
      → Deposit release BLOCKED
      → Evidence required (photos)
      → Admin review
    ↓
    ⏱️  WINDOW CLOSES (if no claims)
    ↓
    IF no claims:
      → depositRefundJob proceeds
      → 100% to guest
      → bookingStatus → COMPLETED
```

**Resolution Outcomes:**

**1. Claim Approved:**
```typescript
bookingStatus: DISPUTED → COMPLETED
paymentStatus: PARTIALLY_RELEASED → SETTLED

Actions:
1. Deduct approved amount from deposit → Realtor
2. Refund remaining deposit → Guest
3. Mark booking as COMPLETED
```

**2. Claim Denied:**
```typescript
bookingStatus: DISPUTED → COMPLETED
paymentStatus: PARTIALLY_RELEASED → SETTLED

Actions:
1. Refund 100% deposit → Guest
2. Mark booking as COMPLETED
```

**3. Partial Approval:**
```typescript
bookingStatus: DISPUTED → COMPLETED
paymentStatus: PARTIALLY_RELEASED → SETTLED

Actions:
1. Partial amount → Realtor
2. Remaining → Guest
3. Mark booking as COMPLETED
```

---

### Dispute Integration with Money Flow

**Impact on Room Fee Release:**
```typescript
// roomFeeReleaseJob.ts
WHERE {
  bookingStatus: ACTIVE
  NO disputes with scope = ROOM_FEE  // ← Blocks if ROOM_FEE dispute active
  roomFeeReleaseEligibleAt: <= NOW
}
```

**Impact on Deposit Release:**
```typescript
// depositRefundJob.ts
WHERE {
  bookingStatus: ACTIVE
  NO disputes with scope = DEPOSIT  // ← Blocks if DEPOSIT dispute active
  depositRefundEligibleAt: <= NOW
}
```

**Key Files:**
- [dispute.routes.ts](booking-backend/src/routes/dispute.routes.ts) - Dispute CRUD
- [disputeService.ts](booking-backend/src/services/disputeService.ts) - Dispute logic

---

## 🔐 STATE MACHINE REFERENCE

### Valid State Transitions

#### BookingStatus Transitions

| From      | To        | Trigger                    | Requirements |
|-----------|-----------|----------------------------|--------------|
| PENDING   | ACTIVE    | Payment success            | paymentStatus = HELD |
| PENDING   | CANCELLED | Timeout / Cancel           | No payment made |
| ACTIVE    | DISPUTED  | Dispute opened             | Guest or realtor raises dispute |
| ACTIVE    | CANCELLED | Pre-checkin cancel         | stayStatus = NOT_STARTED |
| ACTIVE    | COMPLETED | Deposit released           | stayStatus = CHECKED_OUT, all money settled |
| DISPUTED  | ACTIVE    | Dispute resolved (partial) | Admin resolves, booking continues |
| DISPUTED  | COMPLETED | Dispute resolved (final)   | Admin resolves, marks complete |
| DISPUTED  | CANCELLED | Major dispute              | Admin cancels with refund |

#### StayStatus Transitions (Monotonic)

| From        | To          | Trigger            | Requirements |
|-------------|-------------|--------------------|--------------|
| NOT_STARTED | CHECKED_IN  | Check-in confirmed | Realtor confirms OR auto after 30 min |
| CHECKED_IN  | CHECKED_OUT | Checkout confirmed | Guest/realtor confirms OR auto after 1hr |

#### PaymentStatus Transitions

| From               | To                  | Trigger              | Requirements |
|--------------------|---------------------|----------------------|--------------|
| INITIATED          | HELD                | Payment success      | Funds in escrow |
| HELD               | PARTIALLY_RELEASED  | Room fee released    | 1hr after check-in, no disputes |
| HELD               | REFUNDED            | Cancellation         | Pre-check-in only |
| PARTIALLY_RELEASED | SETTLED             | Deposit released     | 4hr after checkout, no disputes |
| PARTIALLY_RELEASED | REFUNDED            | Dispute full refund  | Admin decision |
| INITIATED          | FAILED              | Payment error        | Paystack failure |

---

### Valid State Combinations Matrix

| BookingStatus | StayStatus   | PaymentStatus      | Valid? | Next Actions |
|---------------|--------------|--------------------| -------|--------------|
| PENDING       | NOT_STARTED  | INITIATED          | ✅ Yes | Pay or timeout |
| ACTIVE        | NOT_STARTED  | HELD               | ✅ Yes | Check-in or cancel |
| ACTIVE        | CHECKED_IN   | HELD               | ✅ Yes | Wait for room fee release |
| ACTIVE        | CHECKED_IN   | PARTIALLY_RELEASED | ✅ Yes | Checkout |
| ACTIVE        | CHECKED_OUT  | PARTIALLY_RELEASED | ✅ Yes | Wait for deposit release |
| DISPUTED      | CHECKED_IN   | HELD               | ✅ Yes | Admin resolution |
| DISPUTED      | CHECKED_OUT  | PARTIALLY_RELEASED | ✅ Yes | Admin resolution (deposit) |
| COMPLETED     | CHECKED_OUT  | SETTLED            | ✅ Yes | Terminal (can review) |
| CANCELLED     | NOT_STARTED  | REFUNDED           | ✅ Yes | Terminal |
| PENDING       | CHECKED_IN   | ANY                | ❌ No  | Invalid - cannot check-in unpaid |
| CANCELLED     | CHECKED_IN   | ANY                | ❌ No  | Invalid - cannot cancel after check-in |
| CANCELLED     | CHECKED_OUT  | ANY                | ❌ No  | Invalid - cannot cancel after check-in |
| COMPLETED     | NOT_STARTED  | ANY                | ❌ No  | Invalid - cannot complete without checkout |

---

### State Validation Code

```typescript
// Cancellation validation
function canCancel(booking: Booking): boolean {
  return (
    booking.stayStatus === "NOT_STARTED" &&
    booking.bookingStatus === "ACTIVE" &&
    !hasActiveDisputes(booking)
  );
}

// Check-in validation
function canCheckIn(booking: Booking): boolean {
  return (
    booking.stayStatus === "NOT_STARTED" &&
    booking.bookingStatus === "ACTIVE" &&
    booking.payment?.status === "HELD"
  );
}

// Checkout validation
function canCheckOut(booking: Booking): boolean {
  return (
    booking.stayStatus === "CHECKED_IN" &&
    booking.bookingStatus === "ACTIVE"
  );
}

// Completion validation
function canComplete(booking: Booking): boolean {
  return (
    booking.stayStatus === "CHECKED_OUT" &&
    booking.bookingStatus === "ACTIVE" &&
    booking.payment?.depositRefunded === true &&
    !hasActiveDisputes(booking)
  );
}

// Dispute scope validation
function canOpenRoomFeeDispute(booking: Booking): boolean {
  return (
    booking.stayStatus === "CHECKED_IN" &&
    booking.bookingStatus === "ACTIVE" &&
    booking.checkinConfirmedAt &&
    (NOW - booking.checkinConfirmedAt) <= 1_HOUR
  );
}

function canOpenDepositDispute(booking: Booking): boolean {
  return (
    booking.stayStatus === "CHECKED_OUT" &&
    booking.bookingStatus === "ACTIVE" &&
    booking.checkOutTime &&
    (NOW - booking.checkOutTime) <= 4_HOURS
  );
}
```

---

## 📊 COMPLETE FLOW EXAMPLES

### Example 1: Successful Booking (No Issues)

```
DAY 1, 10:00 AM: Payment Received (₦110,000)
├─→ bookingStatus: PENDING → ACTIVE
├─→ stayStatus: NOT_STARTED
├─→ paymentStatus: INITIATED → HELD
└─→ Money Distribution:
    ├─→ Cleaning Fee (₦5,000) → Realtor Wallet ✓ NEVER REFUNDABLE
    ├─→ Service Fee (₦2,000) → Platform Wallet ✓ NEVER REFUNDABLE
    ├─→ Room Fee (₦100,000) → Escrow 🔒
    └─→ Security Deposit (₦3,000) → Escrow 🔒

DAY 3, 2:00 PM: Check-In Time
├─→ Realtor confirms check-in at 2:15 PM
├─→ bookingStatus: ACTIVE (no change)
├─→ stayStatus: NOT_STARTED → CHECKED_IN
├─→ paymentStatus: HELD (no change yet)
└─→ Timers Started:
    ├─→ Room fee eligible at 3:15 PM (1 hour)
    ├─→ Dispute window closes at 3:15 PM
    └─→ Guest can raise ROOM_FEE disputes

DAY 3, 3:15 PM: (+1 Hour After Check-In)
├─→ roomFeeReleaseJob runs (every 5 min)
├─→ No ROOM_FEE disputes found ✓
├─→ paymentStatus: HELD → PARTIALLY_RELEASED
└─→ Room Fee Released:
    ├─→ Realtor (₦90,000) ✓
    └─→ Platform (₦10,000) ✓

DAY 7, 11:00 AM: Check-Out Time
├─→ Guest confirms checkout at 11:00 AM
├─→ bookingStatus: ACTIVE (no change)
├─→ stayStatus: CHECKED_IN → CHECKED_OUT
├─→ paymentStatus: PARTIALLY_RELEASED (no change yet)
└─→ Timer Started:
    ├─→ Deposit eligible at 3:00 PM (4 hours)
    └─→ Realtor can raise DEPOSIT disputes

DAY 7, 3:00 PM: (+4 Hours After Check-Out)
├─→ depositRefundJob runs (every 5 min)
├─→ No DEPOSIT disputes found ✓
├─→ paymentStatus: PARTIALLY_RELEASED → SETTLED
├─→ Security Deposit Released:
│   └─→ Guest Refund (₦3,000) ✓
└─→ bookingStatus: ACTIVE → COMPLETED

FINAL STATE:
bookingStatus: COMPLETED ✅
stayStatus: CHECKED_OUT ✅
paymentStatus: SETTLED ✅

MONEY DISTRIBUTION:
├─→ Realtor received: ₦95,000 (cleaning ₦5,000 + room fee ₦90,000)
├─→ Platform received: ₦12,000 (service ₦2,000 + commission ₦10,000)
└─→ Guest refunded: ₦3,000 (security deposit)
Total: ₦110,000 ✓
```

---

### Example 2: Early Cancellation (25 Hours Before Check-In)

```
DAY 1, 10:00 AM: Payment Received (₦110,000)
├─→ bookingStatus: PENDING → ACTIVE
├─→ stayStatus: NOT_STARTED
├─→ paymentStatus: INITIATED → HELD
└─→ Money in escrow: ₦103,000 (room + deposit)
    Cleaning in realtor wallet: ₦5,000
    Service in platform wallet: ₦2,000

DAY 2, 1:00 PM: Guest Cancels (25 hours before check-in)
├─→ Validation:
│   ├─→ stayStatus = NOT_STARTED ✓
│   ├─→ bookingStatus = ACTIVE ✓
│   └─→ No active disputes ✓
├─→ Time until check-in: 25 hours → EARLY tier
└─→ Cancellation Process:
    ├─→ Calculate refunds:
    │   ├─ Guest: 90% of ₦100,000 + ₦3,000 = ₦93,000
    │   ├─ Realtor: 7% of ₦100,000 = ₦7,000 (from escrow)
    │   └─ Platform: 3% of ₦100,000 = ₦3,000 (from escrow)
    │
    ├─→ Execute Paystack refund: ₦93,000 to guest ✓
    ├─→ Credit realtor wallet: ₦7,000 (from escrow) ✓
    ├─→ Credit platform wallet: ₦3,000 (from escrow) ✓
    │
    └─→ Update states:
        ├─→ bookingStatus: ACTIVE → CANCELLED
        ├─→ stayStatus: NOT_STARTED (no change)
        └─→ paymentStatus: HELD → REFUNDED

FINAL STATE:
bookingStatus: CANCELLED ✅
stayStatus: NOT_STARTED ✅
paymentStatus: REFUNDED ✅

MONEY DISTRIBUTION:
├─→ Guest refunded: ₦93,000
├─→ Realtor kept: ₦12,000 (cleaning ₦5,000 + comp ₦7,000)
├─→ Platform kept: ₦5,000 (service ₦2,000 + retention ₦3,000)
Total: ₦110,000 ✓

NOTE: Cleaning & service fees NEVER refunded ✓
```

---

### Example 3: Guest Dispute (Room Quality Issue)

```
DAY 3, 2:15 PM: Check-In Confirmed
├─→ stayStatus: NOT_STARTED → CHECKED_IN
├─→ 1-hour dispute window opens

DAY 3, 2:45 PM: Guest Opens Dispute (within 1-hour window)
├─→ Dispute type: ROOM_FEE scope
├─→ Issue: "Room not as clean as described"
├─→ Evidence: Photos uploaded
└─→ State changes:
    ├─→ bookingStatus: ACTIVE → DISPUTED
    └─→ Room fee release BLOCKED

DAY 3, 3:15 PM: Room Fee Release Job Runs
├─→ Query finds booking
├─→ Checks for ROOM_FEE disputes
├─→ Dispute found ❌
└─→ Release BLOCKED (skips this booking)

DAY 4, 10:00 AM: Admin Reviews Dispute
Decision: Partial refund (30% to guest)

ADMIN ACTIONS:
1. Refund 30% of room fee to guest:
   └─→ ₦30,000 via Paystack ✓

2. Release remaining 70% as split:
   ├─→ Realtor: 90% of ₦70,000 = ₦63,000 ✓
   └─→ Platform: 10% of ₦70,000 = ₦7,000 ✓

3. Update states:
   ├─→ bookingStatus: DISPUTED → ACTIVE
   ├─→ paymentStatus: HELD → PARTIALLY_RELEASED
   └─→ Room fee now FINAL (no more disputes)

BOOKING CONTINUES NORMALLY:
DAY 7, 11:00 AM: Guest checks out
DAY 7, 3:00 PM: Deposit released (₦3,000)
bookingStatus: ACTIVE → COMPLETED

FINAL MONEY DISTRIBUTION:
├─→ Guest: ₦30,000 (refund) + ₦3,000 (deposit) = ₦33,000
├─→ Realtor: ₦5,000 (cleaning) + ₦63,000 (room) = ₦68,000
├─→ Platform: ₦2,000 (service) + ₦7,000 (commission) = ₦9,000
Total: ₦110,000 ✓
```

---

### Example 4: Realtor Damage Claim

```
DAY 7, 11:00 AM: Guest Checks Out
├─→ stayStatus: CHECKED_IN → CHECKED_OUT
├─→ 4-hour dispute window opens for DEPOSIT claims

DAY 7, 1:30 PM: Realtor Opens Damage Claim (within 4-hour window)
├─→ Dispute type: DEPOSIT scope
├─→ Issue: "Broken mirror in bathroom"
├─→ Evidence: Photos of damage
├─→ Claimed amount: ₦15,000
└─→ State changes:
    ├─→ bookingStatus: ACTIVE → DISPUTED
    └─→ Deposit release BLOCKED

DAY 7, 3:00 PM: Deposit Refund Job Runs
├─→ Query finds booking
├─→ Checks for DEPOSIT disputes
├─→ Dispute found ❌
└─→ Release BLOCKED (skips this booking)

DAY 8, 10:00 AM: Admin Reviews Damage Claim
Decision: Approve ₦15,000 damage claim

ADMIN ACTIONS:
1. Deduct damage from deposit:
   └─→ ₦15,000 → Realtor wallet ✓

2. Refund remaining deposit:
   └─→ ₦35,000 → Guest refund ✓
   (Original ₦50,000 - ₦15,000)

3. Update states:
   ├─→ bookingStatus: DISPUTED → COMPLETED
   ├─→ paymentStatus: PARTIALLY_RELEASED → SETTLED
   └─→ Booking finalized

FINAL MONEY DISTRIBUTION:
├─→ Guest: ₦35,000 (remaining deposit after damage)
├─→ Realtor: ₦5,000 (cleaning) + ₦90,000 (room) + ₦15,000 (damage) = ₦110,000
├─→ Platform: ₦2,000 (service) + ₦10,000 (commission) = ₦12,000
Total: ₦110,000 + ₦35,000 (to guest) = ₦157,000 ✓
(Note: Guest originally paid ₦160,000 with ₦50,000 deposit)
```

---

### Example 5: Attempted Cancellation After Check-In (Blocked)

```
DAY 3, 2:15 PM: Check-In Confirmed
├─→ stayStatus: NOT_STARTED → CHECKED_IN
├─→ bookingStatus: ACTIVE

DAY 4, 10:00 AM: Guest Tries to Cancel
└─→ Validation:
    ├─→ stayStatus = CHECKED_IN ❌
    └─→ Error thrown

SYSTEM RESPONSE:
❌ Error: "Cannot cancel after check-in. Use dispute system instead."

REASON:
- stayStatus = CHECKED_IN means service has been consumed
- Cancellation only allowed when stayStatus = NOT_STARTED
- Guest must use dispute system for refunds after check-in
```

---

## 🚀 IMPLEMENTATION STATUS

### ✅ Fully Implemented

- ✅ Three parallel state machines (BookingStatus + StayStatus + PaymentStatus)
- ✅ Payment processing & escrow holding
- ✅ **Cleaning & service fees NEVER refundable** (immediate release)
- ✅ Check-in confirmation (realtor + auto-fallback)
- ✅ StayStatus tracking (NOT_STARTED → CHECKED_IN → CHECKED_OUT)
- ✅ Room fee release after 1-hour dispute window (ROOM_FEE scope check)
- ✅ Deposit refund after 4-hour dispute window (DEPOSIT scope check)
- ✅ **Cancellation blocked after check-in** (stayStatus validation)
- ✅ **Refund tiers apply ONLY to room fee** (not total payment)
- ✅ Deposit always 100% refunded (unless damage proven)
- ✅ **DisputeScope enum** (ROOM_FEE vs DEPOSIT)
- ✅ State machine validation
- ✅ Audit logging via escrow events

### 🚧 Pending Implementation

⚠️ Auto-checkout after checkOutTime + 1 hour  
⚠️ Guest manual check-in (disabled for security, may re-enable)  
⚠️ Webhook handling for Paystack transfers  
⚠️ Admin dashboard for manual overrides  
⚠️ Comprehensive integration testing

---

## 🔑 KEY ARCHITECTURAL DECISIONS

### 1. Three Parallel State Machines

**Why?**
- Separates business state (BookingStatus), physical state (StayStatus), and money state (PaymentStatus)
- Each state machine has clear responsibilities
- Easier to reason about state transitions
- Clearer debugging and audit trails

### 2. Cleaning & Service Fees NEVER Refundable

**Why?**
- Simplifies accounting (no clawback logic)
- Once in wallets, money doesn't move
- Clear expectations for all parties
- Prevents accounting explosions

### 3. Refund Tiers Apply ONLY to Room Fee

**Why?**
- Room fee is the only service-dependent component
- Deposit is always 100% refundable (not service-dependent)
- Cleaning/service fees already non-refundable
- Prevents misleading calculations

### 4. DisputeScope Enum (ROOM_FEE vs DEPOSIT)

**Why?**
- Different disputes gate different money flows
- ROOM_FEE disputes don't affect deposit release
- DEPOSIT disputes don't affect room fee (already released)
- Clearer admin decision-making

### 5. Cancellation Only Before Check-In

**Why?**
- Once guest checks in, service is consumed
- After check-in, disputes handle refunds
- Prevents abuse of cancellation system
- Clear cutoff point (stayStatus = CHECKED_IN)

### 6. COMPLETED Transition at Deposit Release

**Why?**
- Booking only complete when ALL money distributed
- depositRefundJob is the ONLY place this happens
- Clear terminal state
- Prevents premature completion

### 7. Deposit Timing: 4 Hours (Not 2)

**Why?**
- Gives realtor adequate time to inspect property
- Sufficient for damage assessment
- Consistent across all documentation
- Single source of truth

---

## 📚 KEY IMPLEMENTATION FILES

### Core Services
- [escrowService.ts](booking-backend/src/services/escrowService.ts) - Escrow management
- [checkinService.ts](booking-backend/src/services/checkinService.ts) - Check-in logic
- [refund.ts](booking-backend/src/services/refund.ts) - Refund calculations
- [disputeService.ts](booking-backend/src/services/disputeService.ts) - Dispute logic
- [walletService.ts](booking-backend/src/services/walletService.ts) - Wallet operations

### Cron Jobs
- [checkinFallbackJob.ts](booking-backend/src/jobs/checkinFallbackJob.ts) - Auto check-in
- [roomFeeReleaseJob.ts](booking-backend/src/jobs/roomFeeReleaseJob.ts) - Room fee release
- [depositRefundJob.ts](booking-backend/src/jobs/depositRefundJob.ts) - Deposit refund + completion
- [unpaidBookingCron.ts](booking-backend/src/jobs/unpaidBookingCron.ts) - Cancel unpaid bookings

### Routes
- [booking.routes.ts](booking-backend/src/routes/booking.routes.ts) - Booking CRUD
- [payment.routes.ts](booking-backend/src/routes/payment.routes.ts) - Payment initiation
- [webhook.routes.ts](booking-backend/src/routes/webhook.routes.ts) - Paystack webhooks
- [dispute.routes.ts](booking-backend/src/routes/dispute.routes.ts) - Dispute management

### Database
- [schema.prisma](booking-backend/prisma/schema.prisma) - All models and enums

---

## ✅ TESTING CHECKLIST

### State Transitions
- [ ] PENDING → ACTIVE (payment success)
- [ ] ACTIVE + NOT_STARTED → ACTIVE + CHECKED_IN (check-in)
- [ ] ACTIVE + CHECKED_IN → ACTIVE + CHECKED_OUT (checkout)
- [ ] ACTIVE + CHECKED_OUT → COMPLETED + CHECKED_OUT (deposit release)
- [ ] ACTIVE + NOT_STARTED → CANCELLED + NOT_STARTED (cancellation)
- [ ] ACTIVE → DISPUTED (dispute opened)
- [ ] DISPUTED → ACTIVE (dispute resolved, continues)
- [ ] DISPUTED → COMPLETED (dispute resolved, finalized)

### Money Flow
- [ ] Room fee + deposit go to escrow (HELD)
- [ ] Cleaning fee + service fee released immediately (NEVER refundable)
- [ ] Room fee released after 1-hour (paymentStatus → PARTIALLY_RELEASED)
- [ ] Deposit refunded after 4-hour (paymentStatus → SETTLED)
- [ ] Cancellation refunds follow tier system (room fee only)
- [ ] Deposit always 100% refunded (unless damage proven)

### Dispute Scopes
- [ ] ROOM_FEE dispute blocks room fee release only
- [ ] DEPOSIT dispute blocks deposit release only
- [ ] Room fee disputes don't affect deposit release timing
- [ ] Deposit disputes don't affect room fee (already released)

### Edge Cases
- [ ] Cannot cancel after check-in (stayStatus validation)
- [ ] Cannot cancel with active dispute
- [ ] Cannot check-in twice
- [ ] Cannot checkout before check-in
- [ ] Unpaid bookings auto-cancel after 30 minutes

### Cron Jobs
- [ ] checkinFallbackJob - Auto check-in after 30 min
- [ ] roomFeeReleaseJob - Release after 1 hour + no ROOM_FEE disputes
- [ ] depositRefundJob - Refund after 4 hours + no DEPOSIT disputes + mark COMPLETED
- [ ] unpaidBookingCron - Cancel unpaid after 30 min

---

## 🎯 CRITICAL REMINDERS

### 🚨 NEVER FORGET

1. **Cleaning & Service Fees = NEVER REFUNDABLE**
   - No exceptions
   - Not even in full refund scenarios
   - Once in wallets, they stay there

2. **Refund Tiers = Room Fee ONLY**
   - Not calculated on total payment
   - Deposit always 100% refunded
   - Cleaning/service fees already out

3. **DisputeScope Gates Money Flow**
   - ROOM_FEE disputes → block room fee release
   - DEPOSIT disputes → block deposit release
   - Check scope in all money release jobs

4. **Deposit Timing = 4 Hours**
   - Not 2 hours
   - Not 2 hours for guest + 4 for realtor
   - Single 4-hour window for ALL deposit disputes

5. **Cancellation = stayStatus Check**
   - Must be NOT_STARTED
   - After CHECKED_IN, use disputes
   - No exceptions

6. **PaymentStatus Granularity**
   - HELD → money in escrow
   - PARTIALLY_RELEASED → room fee out, deposit still in
   - SETTLED → everything distributed
   - Don't confuse RELEASED with SETTLED

---

**END OF DOCUMENTATION**
- Booking status: ACTIVE or COMPLETED
- checkOutTime: NOT NULL
- depositRefundEligibleAt: <= NOW
- payment.depositRefunded: false
- NO active damage disputes from realtor
```

**Release Logic:**
```
IF no damage claims:
  100% → Guest refund
  
IF damage claim approved:
  Deducted amount → Realtor
  Remaining amount → Guest refund
  
Example:
  Deposit: ₦50,000
  Damage claim: ₦20,000
  ├─→ ₦20,000 → Realtor
  └─→ ₦30,000 → Guest refund
```

**Database Updates:**
```typescript
payment.update({
  depositRefunded: true,
  depositDeductionProcessed: true,
  depositPartialRefundAmount: 30000,
  depositPartialRefundReference: "DEPOSIT_REFUND_xxx",
  depositReleasedAt: NOW
});
``After Successful Refund:**
```typescript
booking.update({
  status: "COMPLETED" // Final state transition
});
```

**Key Files:**
- `depositRefundJob.ts` - Automated deposit refund cron job
- Runs every 5 minutes
- Marks booking as COMPLETED after successful refund

---

## 🔄 CANCELLATION & REFUND FLOW

### 🚨 CRITICAL RULE: Cancellation Window

**Cancellation is ONLY allowed when:**
```typescript
stayStatus === "NOT_STARTED"
```

**Why?**
- Once guest checks in, they've consumed the service
- After check-in, disputes are used instead of cancellations
- Prevents abuse of cancellation system

**State Requirements:**
```typescript
// Can cancel:
bookingStatus = ACTIVE && stayStatus = NOT_STARTED ✅

// Cannot cancel:
bookingStatus = ACTIVE && stayStatus = CHECKED_IN ❌
bookingStatus = ACTIVE && stayStatus = CHECKED_OUT ❌
bookingStatus = COMPLETED ❌
bookingStatus = DISPUTED ❌ (resolve dispute first)
```
Complete Cancellation Process Flow

```
STEP 1: Validate Cancellation Eligibility
   ├─→ Check: stayStatus === NOT_STARTED
   ├─→ Check: bookingStatus === ACTIVE
   └─→ Check: No active disputes

STEP 2: Calculate Time Until Check-In
   └─→ hoursUntilCheckIn = (checkInTime - NOW) / 3600

STEP 3: Determine Refund Tier
   ├─→ ≥24 hours → EARLY (90% refund)
   ├─→ 12-24 hours → MEDIUM (70% refund)
   ├─→ 0-12 hours → LATE (0% refund)
   └─→ < 0 (past check-in) → NONE (not allowed)

STEP 4: Calculate Refund Split
   Example: ₦110,000 total, EARLY tier
   ├─→ Guest refund: ₦99,000 (90%)
   ├─→ Realtor compensation: ₦7,700 (7%)
   └─→ Platform keeps: ₦3,300 (3%)

STEP 5: Execute Refund Transaction
   ├─→ Paystack API: Refund guest
   ├─→ Credit realtor wallet
   └─→ Update platform wallet
Money Distribution Per Tier

#### EARLY Tier (≥24 hours - 90% Refund)
```
Original Payment: ₦110,000
├─ Room Fee: ₦100,000 (in escrow)
├─ Security Deposit: ₦3,000 (in escrow)
├─ Cleaning Fee: ₦5,000 (already in realtor wallet)
└─ Service Fee: ₦2,000 (already in platform wallet)

REFUND CALCULATION (90% of total):
Guest Receives: ₦99,000
   ├─ From escrow: ₦103,000 available
   └─ 90% = ₦99,000

Realtor Compensation (7% of total = ₦7,700):
   ├─ Already has: ₦5,000 (cleaning fee)
   ├─ Additional from escrow: ₦2,700
   └─ Total: ₦7,700 ✓

Platform Keeps (3% of total = ₦3,300):
   ├─ Already has: ₦2,000 (service fee)
   ├─ Additional from escrow: ₦1,300
   └─ Total: ₦3,300 ✓

ESCROW CALCULATION:
Total in escrow: ₦103,000
├─ Guest refund: ₦99,000
├─ Realtor: ₦2,700
└─ Platform: ₦1,300
= ₦103,000 ✓
```

#### MEDIUM Tier (12-24 hours - 70% Refund)
```
Guest Receives: ₦77,000 (70% of ₦110,000)
Realtor Compensation: ₦22,000 (20% of ₦110,000)
   ├─ Already has: ₦5,000 (cleaning fee)
   └─ Additional: ₦17,000 from escrow
Platform Keeps: ₦11,000 (10% of ₦110,000)
   ├─ Already has: ₦2,000 (service fee)
   └─ Additional: ₦9,000 from escrow
```

#### LATE Tier (0-12 hours - 0% Refund)
```
Guest Receives: ₦0 (no refund)
Realtor Compensation: ₦88,000 (80% of ₦110,000)
   ├─ Already has: ₦5,000 (cleaning fee)
   └─ Additional: ₦83,000 from escrow
Platform Keeps: ₦22,000 (20% of ₦110,000)
   ├─ Already has: ₦2,000 (service fee)
   └─ Additional: ₦20,000 from escrow
```

---

### State Transitions During Cancellation

```
BEFORE CANCELLATION:
bookingStatus = ACTIVE
stayStatus = NOT_STARTED
paymentStatus = HELD
escrowStatus = HOLDING

DURING CANCELLATION:
├─→ Calculate refund tier
├─→ Execute Paystack refund
├─→ Transfer funds from escrow
└─→ Update all statuses

AFTER CANCELLATION:
bookingStatus = CANCELLED (terminal state)
stayStatus = NOT_STARTED (unchanged)
paymentStatus = REFUNDED
escrowStatus = EMPTIED
```

---

### Cancellation Rules & Edge Cases

**1. Cannot Cancel After Check-In**
```typescript
if (booking.stayStatus !== "NOT_STARTED") {
  throw new Error("Cannot cancel after check-in. Use dispute system instead.");
}
```

**2. Active Disputes Block Cancellation**
```typescript
if (booking.bookingStatus === "DISPUTED") {
  throw new Error("Resolve active disputes before cancelling.");
}
```

**3. Already Cancelled**
```typescript
if (booking.bookingStatus === "CANCELLED") {
  throw new Error("Booking already cancelled.");
}
```

**4. Pending Bookings (Unpaid)**
```typescript
if (booking.bookingStatus === "PENDING") {
  // Can cancel without refund (no payment made)
  booking.status = "CANCELLED";
  // No refund processing needed
}
```

**5. Time-Based Auto-Cancel**
```typescript
// Unpaid bookings cancelled after 30 minutes
if (booking.status === "PENDING" && 
    createdAt + 30_minutes < NOW) {
  booking.status = "CANCELLED";
}
```

---

### Key Implementation Files

**Core Services:**REFERENCE

### BookingStatus State Machine

**Valid Transitions:**
```typescript
PENDING → [ACTIVE, CANCELLED]
ACTIVE → [COMPLETED, CANCELLED, DISPUTED]
DISPUTED → [COMPLETED, CANCELLED, ACTIVE]
CANCELLED → [] (terminal state)
COMPLETED → [] (terminal state)
```

**Business Rules:**

| From | To | Trigger | Requirements |
|------|----|---------|--------------| 
| PENDING | ACTIVE | Payment success | paymentStatus = HELD |
| PENDING | CANCELLED | Timeout/Cancel | No payment made |
| ACTIVE | COMPLETED | Deposit released | stayStatus = CHECKED_OUT, all money released |
| ACTIVE | CANCELLED | Pre-checkin cancel | stayStatus = NOT_STARTED |
| ACTIVE | DISPUTED | Dispute opened | Guest or realtor raises dispute |
| DISPUTED | ACTIVE | Dispute resolved | Admin resolves dispute, booking continues |
| DISPUTED | COMPLETED | Dispute resolved | Admin resolves, marks complete |
| DISPUTED | CANCELLED | Major dispute | Admin cancels with full refund |

---

### StCOMPLETE FLOW EXAMPLES

### Example 1: Successful Booking (No Issues)

```
DAY 1: Payment Received (₦110,000)
├─→ bookingStatus: PENDING → ACTIVE
├─→ stayStatus: NOT_STARTED
├─→ paymentStatus: INITIATED → HELD
└─→ Money Distribution:
    ├─→ Cleaning Fee (₦5,000) → Realtor Wallet ✓
    ├─→ Service Fee (₦2,000) → Platform Wallet ✓
    ├─→ Room Fee (₦100,000) → Escrow 🔒
    └─→ Security Deposit (₦3,000) → Escrow 🔒

DAY 2: Check-In Time (10:00 AM)
├─→ Realtor confirms check-in at 10:15 AM
├─→ bookingStatus: ACTIVE (no change)
├─→ stayStatus: NOT_STARTED → CHECKED_IN
└─→ Timers Started:
    ├─→ Room fee eligible at 11:15 AM (1 hour)
    └─→ Dispute window closes at 11:15 AM

DAY 2: 11:15 AM (+1 Hour After Check-In)
├─→ roomFeeReleaseJob runs
├─→ No disputes found
└─→ Room Fee Released:
    ├─→ Realtor (₦90,000) ✓
    ├─→ Platform (₦10,000) ✓
    └─→ paymentStatus: HELD → RELEASED

DAY 5: Check-Out Time (12:00 PM)
├─→ Guest confirms checkout at 12:00 PM
├─→ bookingStatus: ACTIVE (no change)
├─→ stayStatus: CHECKED_IN → CHECKED_OUT
└─→ Timer Started:
    └─→ Deposit eligible at 4:00 PM (4 hours)

DAY 5: 4:00 PM (+4 Hours After Check-Out)
├─→ depositRefundJob runs
├─→ No damage disputes found
├─→ Security Deposit Released:
│   └─→ Guest Refund (₦3,000) ✓
├─→ bookingStatus: ACTIVE → COMPLETED
└─→ stayStatus: CHECKED_OUT (terminal)

FINAL STATE:
bookingStatus: COMPLETED
stayStatus: CHECKED_OUT
paymentStatus: REFUNDED (deposit returned)

MONEY DISTRIBUTION:
├─→ Realtor received: ₦95,000 (cleaning + 90% room fee)
├─→ Platform received: ₦12,000 (service + 10% room fee)
└─→ Guest refunded: ₦3,000 (security deposit)
Total: ₦110,000 ✓
```

---

### Example 2: Early Cancellation (25 Hours Before Check-In)

```
DAY 1: Payment Received (₦110,000)
├─→ bookingStatus: PENDING → ACTIVE
├─→ stayStatus: NOT_STARTED
├─→ paymentStatus: INITIATED → HELD
└─→ Money in escrow: ₦103,000

DAY 1 (Evening): Guest Cancels
├─→ Time until check-in: 25 hours
├─→ Refund tier: EARLY (90%)
└─→ Cancellation Process:
    ├─→ Calculate: 90% of ₦110,000 = ₦99,000 guest refund
    ├─→ Calculate: 7% of ₦110,000 = ₦7,700 realtor compensation
    ├─→ Calculate: 3% of ₦110,000 = ₦3,300 platform keeps
    └─→ Execute refund transactions

MONEY DISTRIBUTION:
├─→ Guest refund: ₦99,000 (from escrow) ✓
├─→ Realtor keeps:
│   ├─→ Cleaning fee: ₦5,000 (already in wallet)
│   └─→ Additional: ₦2,700 (from escrow)
│   Total: ₦7,700 ✓
└─→ Platform keeps:
    ├─→ Service fee: ₦2,000 (already in wallet)
    └─→ Additional: ₦1,300 (from escrow)
    Total: ₦3,300 ✓

FINAL STATE:
bookingStatus: CANCELLED
stayStatus: NOT_STARTED
paymentStatus: REFUNDED
```

---

### Example 3: Late Cancellation (8 Hours Before Check-In)

```
Guest tries to cancel 8 hours before check-in
├─→ Refund tier: LATE (0% refund)
└─→ Money Distribution:
    ├─→ Guest refund: ₦0 (no refund)
    ├─→ Realtor compensation:
    │   ├─→ Cleaning fee: ₦5,000
    │   └─→ 80% of total: ₦83,000
    │   Total: ₦88,000 ✓
    └─→ Platform keeps:
        ├─→ Service fee: ₦2,000
        └─→ 20% of total: ₦20,000
        Total: ₦22,000 ✓

FINAL STATE:
bookingStatus: CANCELLED
stayStatus: NOT_STARTED
paymentStatus: REFUNDED (₦0 to guest)
```

---

### Example 4: Attempted Cancellation After Check-In (Blocked)

```
DAY 2: Guest Checked In
├─→ bookingStatus: ACTIVE
├─→ stayStatus: CHECKED_IN
└─→ Guest tries to cancel

SYSTEM RESPONSE:
❌ Error: "Cannot cancel after check-in. Use dispute system instead."

REASON:
Once stayStatus = CHECKED_IN, cancellation is blocked.
Guest must use the dispute system for refunds.
```

---

### Example 5: Cancellation with Active Dispute (Blocked)

```
Guest opens dispute, then tries to cancel
├─→ bookingStatus: DISPUTED
├─→ stayStatus: NOT_STARTED
└─→ Guest tries to cancel

SYSTEM RESPONSE:
❌ Error: "Resolve active disputes before cancelling."

REASON:
Disputes must be resolved first to determine
proper money distribution.

// 2. Check-in only if not already checked in
function canCheckIn(booking: Booking): boolean {
  **Three parallel state machines** (BookingStatus + StayStatus + PaymentStatus)  
✅ Payment processing & escrow holding  
✅ Immediate cleaning fee & service fee release  
✅ Check-in confirmation (realtor + auto-fallback)  
✅ **StayStatus tracking** (NOT_STARTED → CHECKED_IN → CHECKED_OUT)  
✅ Room fee release after 1-hour dispute window  
✅ **Deposit refund job** with automatic COMPLETED transition  
✅ **Cancellation blocked after check-in** (stayStatus validation)  
✅ Tier-based refund calculation (EARLY/MEDIUM/LATE)  
✅ Dispute system integration  
✅ State machine validation  
✅ Audit logging via escrow events  

## 🚧 WHAT'S PENDING

⚠️ Auto-checkout after checkOutTime + 1 hour  
⚠️ Guest manual check-in (disabled for security, may re-enable with timing fix)  
⚠️ Webhook handling for Paystack transfers to realtors  
⚠️ Comprehensive integration testing across all flows  
⚠️ Admin dashboard for manual money release overrides  
⚠️ Cancellation fee clawback from wallets (currently deducts from escrow only)

---

## 🎯 KEY ARCHITECTURAL DECISIONS

### 1. **Three Parallel State Machines**
- **BookingStatus**: Business/financial state
- **StayStatus**: Physical guest state  
- **PaymentStatus**: Money movement state
- **Why?** Separation of concerns, clearer logic, easier debugging

### 2. **Cancellation Only Before Check-In**
- **Rule**: `stayStatus === NOT_STARTED` required
- **Why?** Once guest checks in, service is consumed
- **Alternative**: Dispute system for post-check-in issues

### 3. **COMPLETED Transition at Deposit Release**
- **Trigger**: `depositRefundJob` after 4-hour window
- **Why?** Booking only complete when all money distributed
- **Before**: Incorrectly marked COMPLETED at checkout

### 4. **Immutable Money Rules**
- **Cleaning Fee**: Never refundable (immediate release)
- **Service Fee**: Never refundable (immediate release)
- **Room Fee**: Refundable only via tiers before check-in
- **Deposit**: Always 100% refundable (unless damage proven)

### 5. **Dispute Window Protection**
- **1 hour** after check-in: Guest can dispute room fee
- **4 hours** after checkout: Realtor can claim damages
- **Why?** Balanced protection for both parties

---

## 📝 TESTING CHECKLIST

### State Transitions
- [ ] PENDING → ACTIVE (payment success)
- [ ] ACTIVE + NOT_STARTED → ACTIVE + CHECKED_IN (check-in)
- [ ] ACTIVE + CHECKED_IN → ACTIVE + CHECKED_OUT (checkout)
- [ ] ACTIVE + CHECKED_OUT → COMPLETED + CHECKED_OUT (deposit release)
- [ ] ACTIVE + NOT_STARTED → CANCELLED + NOT_STARTED (cancellation)
- [ ] ACTIVE → DISPUTED (dispute opened)
- [ ] DISPUTED → ACTIVE (dispute resolved)

### Money Flow
- [ ] Room fee + deposit go to escrow
- [ ] Cleaning fee + service fee released immediately
- [ ] Room fee released after 1-hour dispute window
- [ ] Deposit refunded after 4-hour claim window
- [ ] Cancellation refunds follow tier system

### Edge Cases
- [ ] Cannot cancel after check-in (stayStatus validation)
- [ ] Cannot cancel with active dispute
- [ ] Cannot check-in twice
- [ ] Cannot checkout before check-in
- [ ] Unpaid bookings auto-cancel after 30 minutes

### Cron Jobs
- [ ] `checkinFallbackJob` - Auto check-in after 30 min
- [ ] `roomFeeReleaseJob` - Release after 1 hour + no disputes
- [ ] `depositRefundJob` - Refund after 4 hours + no disputes + mark COMPLETED
- [ ] `unpaidBookingCron` - Cancel unpaid after 30 min

---

## 🔄 MIGRATION FROM OLD SYSTEM

### What Changed?

**Old System:**
```
BookingStatus: PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, COMPLETED
PaymentStatus: INITIATED, ESCROW_HELD, PARTIAL_RELEASED, COMPLETED
```

**New System:**
```
BookingStatus: PENDING, ACTIVE, DISPUTED, COMPLETED, CANCELLED
StayStatus: NOT_STARTED, CHECKED_IN, CHECKED_OUT (NEW!)
PaymentStatus: INITIATED, HELD, RELEASED, REFUNDED, FAILED
```

**Key Improvements:**
1. **Separated physical state** from business state
2. **Clearer money tracking** (HELD vs RELEASED)
3. **Explicit cancellation rules** (only before check-in)
4. **Automatic completion** (deposit job marks COMPLETED)
5. **Monotonic stay progression** (can't go backwards)
```

**Key Files:**
- `bookingStatus.ts` - State machine validation
- `checkinService.ts` - Check-in state transitions
- `booking.routes.ts` - Checkout state transitions
- `depositRefundJob.ts` - Completion state transitionn time
   ↓
3. Calculate refund split:
   - Customer refund amount
   - Realtor compensation
   - Platform fee retention
   ↓
4. Process Paystack refund to customer
   ↓
5. Update payment record:
   - status → REFUNDED
   - refundAmount = customer refund
   - refundedAt = NOW
   ↓
6. Credit realtor wallet with compensation
   ↓
7. Create escrow event for audit trail
   ↓
8. Send refund confirmation emails
```

### What Gets Refunded?

**EARLY Tier (90% refund example):**
```
Original Payment: ₦110,000
├─ Room Fee: ₦100,000
├─ Cleaning Fee: ₦5,000 (already in realtor wallet)
├─ Security Deposit: ₦3,000
└─ Service Fee: ₦2,000 (already in platform wallet)

Refund Calculation (90% of total):
└─→ Guest receives: ₦99,000

Realtor Compensation (7% of total):
└─→ Realtor receives: ₦7,700

Platform Keeps (3% of total):
└─→ Platform keeps: ₦3,300

Note: Cleaning fee and service fee already released,
so they're deducted from realtor/platform shares
```

**Key Files:**
- `refund.ts` - `calculateRefundSplit()` and `processBookingRefund()`
- `booking.routes.ts` - Cancel booking endpoints
- `webhook.routes.ts` - Paystack refund webhooks

---

## ⚠️ DISPUTE SYSTEM INTEGRATION

### Guest Disputes (Room Fee Protection)

**When:** During 1-hour window after check-in confirmation

**Dispute Window:**
```
Check-In Confirmed
    ↓
    ⏱️  DISPUTE WINDOW OPENS (1 hour)
    ↓
    Guest can raise disputes:
    ├─→ "Room not as described"
    ├─→ "Cleanliness issues"
    ├─→ "Safety concerns"
    └─→ "Amenities missing"
    ↓
    IF dispute raised:
      - Room fee release BLOCKED
      - Booking status → DISPUTED
      - Admin review required
      - Resolution: Refund / Partial / Dismiss
    ↓
    ⏱️  DISPUTE WINDOW CLOSES
    ↓
    IF no disputes:
      - Room fee release proceeds
      - roomFeeReleaseJob releases 90%/10% split
```

**Impact on Money Flow:**
- ✅ Room fee stays in escrow until dispute resolved
- ✅ Cleaning fee already released (may need clawback if major issues)
- ✅ Security deposit unaffected (different dispute window)

### Realtor Disputes (Damage Claims)

**When:** During 4-hour window after check-out

**Dispute Window:**
```
Check-Out Confirmed
    ↓
    ⏱️  REALTOR DISPUTE WINDOW OPENS (4 hours)
    ↓
    Realtor can claim damages:
    ├─→ "Property damage"
    ├─→ "Missing items"
    ├─→ "Extra cleaning required"
    └─→ "Unauthorized guests"
    ↓
    IF damage claim raised:
      - Security deposit release BLOCKED
      - Claim requires evidence (photos)
      - Admin review required
      - Resolution: Approve / Partial / Deny
    ↓
    ⏱️  DISPUTE WINDOW CLOSES
    ↓
    IF no claims:
      - Full security deposit refunded to guest
      - depositReleaseJob processes refund
```

**Impact on Money Flow:**
- ✅ Security deposit stays in escrow until claim resolved
- ✅ Room fee already released (separate timeline)
- ✅ If claim approved: Deduct from deposit, refund remainder

### Dispute Status Flow

```
Dispute Created
    status: OPEN
    ↓
Realtor/Guest Responds
    status: AWAITING_RESPONSE
    ↓
IF complex → Admin Escalates
    status: ESCALATED
    ↓
Admin Makes Decision
    status: RESOLVED_GUEST_WIN
    status: RESOLVED_HOST_WIN  
    status: RESOLVED_PARTIAL
    status: RESOLVED_DISMISSED
```

**Key Files:**
- `dispute.routes.ts` - Dispute creation and management
- `roomFeeReleaseJob.ts` - Checks for active disputes before release
- Future: `securityDepositReleaseJob.ts` - Will check for damage disputes

---

## 🔐 STATE MACHINE & VALIDATION

### Booking Status Transitions

**Valid Transitions:**
```typescript
PENDING → [ACTIVE, CANCELLED]
ACTIVE → [COMPLETED, CANCELLED, DISPUTED]
DISPUTED → [COMPLETED, CANCELLED]
CANCELLED → [] (terminal state)
COMPLETED → [] (terminal state)
```

**Business Rules:**
- **PENDING → ACTIVE**: Requires payment status = HELD
- **ACTIVE → COMPLETED**: Requires all money released + no active disputes
- **ACTIVE → DISPUTED**: Requires active dispute opened
- **ACTIVE → CANCELLED**: Triggers refund flow
- **DISPUTED → COMPLETED**: Requires dispute resolved + money released

**Key Files:**
- `bookingStatus.ts` - State machine validation
- Enforces valid transitions
- Prevents invalid state changes

---

## 📊 SUMMARY: COMPLETE MONEY FLOW

### Successful Booking (No Disputes/Cancellations)

```
DAY 1: Payment Received (₦110,000 example)
├─→ Cleaning Fee (₦5,000) → Realtor Wallet ✓
├─→ Service Fee (₦2,000) → Platform Wallet ✓
├─→ Room Fee (₦100,000) → Escrow 🔒
└─→ Security Deposit (₦3,000) → Escrow 🔒

DAY 2: Check-In Time
└─→ Check-in confirmed (realtor or auto)

DAY 2: +1 Hour After Check-In
└─→ Room Fee Released:
    ├─→ Realtor (₦90,000) ✓
    └─→ Platform (₦10,000) ✓

DAY 5: Check-Out Time
└─→ Check-out confirmed (realtor)

DAY 5: +4 Hours After Check-Out
└─→ Security Deposit Released:
    └─→ Guest Refund (₦3,000) ✓

FINAL STATUS: COMPLETED
```

**Total Distribution:**
- **Realtor receives**: ₦95,000 (cleaning + 90% room fee)
- **Platform receives**: ₦12,000 (service fee + 10% room fee)
- **Guest refunded**: ₦3,000 (security deposit)
- **Total**: ₦110,000 ✓

### Cancelled Booking (Early - 24+ Hours Before)

```
PAYMENT: ₦110,000
├─→ Cleaning Fee (₦5,000) → Already in realtor wallet
├─→ Service Fee (₦2,000) → Already in platform wallet  
├─→ Room Fee (₦100,000) → In escrow
└─→ Security Deposit (₦3,000) → In escrow

CANCELLATION (EARLY tier):
├─→ Guest Refund (90%): ₦99,000 ✓
├─→ Realtor Compensation (7%): ₦7,700 ✓
└─→ Platform Fee (3%): ₦3,300 ✓
    (includes already released cleaning + service fees)

BOOKING STATUS: CANCELLED
PAYMENT STATUS: REFUNDED
```

---

## 🛠️ KEY IMPLEMENTATION FILES

### Core Services
- `escrowService.ts` - Escrow management, fee calculations
- `checkinService.ts` - Check-in confirmation logic
- `bookingStatus.ts` - State machine validation
- `refund.ts` - Refund calculations and processing
- `walletService.ts` - Wallet crediting/debiting

### Cron Jobs
- `checkinFallbackJob.ts` - Auto check-in after 30 minutes
- `roomFeeReleaseJob.ts` - Room fee release after 1-hour dispute window
- `unpaidBookingCron.ts` - Cancel unpaid bookings after 30 minutes

### Routes
- `booking.routes.ts` - Booking CRUD, check-in/out
- `payment.routes.ts` - Payment initiation
- `webhook.routes.ts` - Paystack payment webhooks
- `escrow.routes.ts` - Escrow status queries
- `dispute.routes.ts` - Dispute management

### Database Schema
- `schema.prisma` - All models and relationships
  - Booking model (status, timestamps, fees)
  - Payment model (escrow tracking, release flags)
  - Escrow model (held amounts, status)
  - Dispute model (types, timers, resolutions)

---

## ✅ SYSTEM INTEGRITY CHECKS

### What Prevents Issues?

**1. Double-Release Prevention:**
- `roomFeeSplitDone` flag ensures room fee only released once
- `depositRefunded` flag ensures deposit only refunded once
- `cleaningFeeReleasedToRealtor` flag prevents duplicate crediting

**2. Dispute Protection:**
- Room fee release job checks for active disputes
- Deposit release job checks for damage claims
- Money stays locked until disputes resolved

**3. State Machine Validation:**
- Invalid status transitions blocked by `bookingStatus.ts`
- Business rules enforced (e.g., can't complete without payment)
- Prevents race conditions and invalid states

**4. Timing Validation:**
- Check-in can't happen before checkInTime
- Room fee won't release before 1-hour dispute window
- Deposit won't release before 4-hour claim window

**5. Idempotency:**
- Payment webhooks use unique references
- Cron jobs check flags before processing
- Prevents duplicate payments/refunds

---

## 🚀 WHAT'S WORKING

✅ Payment processing & escrow holding  
✅ Immediate cleaning fee & service fee release  
✅ Check-in confirmation (realtor + auto-fallback)  
✅ Room fee release after 1-hour dispute window  
✅ Dispute system integration  
✅ Refund tier calculation  
✅ State machine validation  
✅ Audit logging via escrow events  

## 🚧 WHAT'S PENDING

⚠️ Security deposit auto-release job (not yet created)  
⚠️ Auto-checkout after checkOutTime + 1 hour  
⚠️ Guest manual check-in (disabled for security, needs timing fix)  
⚠️ Webhook handling for Paystack transfers to realtors  
⚠️ Comprehensive integration testing  
⚠️ Admin dashboard for manual money release overrides
- `booking-backend/src/jobs/depositRefundJob.ts`

**Changes Needed**:
```typescript
// Update all status checks from:
status === "CHECKED_IN_CONFIRMED" → status === "ACTIVE"
status === "CHECKED_OUT" → status === "COMPLETED" (or derive from timestamps)

// Simplify queries - use ONLY:
// - booking.status
// - booking.checkInConfirmedAt
// - booking.checkOutTime
// - booking.roomFeeReleaseEligibleAt
// - booking.depositRefundEligibleAt
```

---

### 5. Payment Route Updates Required
**File**: `booking-backend/src/routes/payment.routes.ts`

**Changes Needed**:
```typescript
// Line ~839: After payment verification
booking.status = "ACTIVE" // was "CONFIRMED"
payment.status = "HELD"   // was "ESCROW_HELD" or "PARTIAL_RELEASED"

// Remove all references to:
// - PARTIAL_RELEASED
// - ESCROW_HELD  
// - ROOM_FEE_SPLIT_RELEASED
```

---

### 6. Booking Routes Updates Required
**File**: `booking-backend/src/routes/booking.routes.ts`

**Changes Needed**:
```typescript
// Line ~560-650: On booking creation
booking.status = "PENDING" // Keep this

// Line ~2600-2670: On check-in confirmation  
booking.status = "ACTIVE" // was "CHECKED_IN_CONFIRMED"

// Line ~2735: On checkout
booking.status = "COMPLETED" // was "CHECKED_OUT"

// Line ~1200-1400: On cancellation
booking.status = "CANCELLED" // Keep this
payment.status = "REFUNDED"  // was "REFUNDED_TO_CUSTOMER"
```

---

### 7. Escrow Service Updates Required
**File**: `booking-backend/src/services/escrowService.ts`

**Changes Needed**:
```typescript
// Line ~140-150: holdFundsInEscrow
payment.status = "HELD" // was "ESCROW_HELD"

// Line ~200-365: releaseRoomFeeSplit  
payment.status = "RELEASED" // was "ROOM_FEE_SPLIT_RELEASED"

// Line ~480-519: returnSecurityDeposit
booking.status = "COMPLETED" // was not set
payment.status = "REFUNDED"  // was "COMPLETED"
```

---

### 8. Cancellation Refund Service Updates
**File**: `booking-backend/src/services/cancellationRefund.ts`

**Changes Needed**:
```typescript
// Line ~160-180: After refund
payment.status = "REFUNDED" // was "REFUNDED_TO_CUSTOMER"
```

---

### 9. Frontend Updates Required
**Files**: All frontend components that check booking/payment status

**Changes Needed**:
```typescript
// Replace all status checks:
'CHECKED_IN' → 'ACTIVE'
'CHECKED_IN_CONFIRMED' → 'ACTIVE'  
'CHECKED_OUT' → 'COMPLETED'
'CONFIRMED' → 'ACTIVE'
'PAID' → 'ACTIVE'

// Payment status:
'ESCROW_HELD' → 'HELD'
'PARTIAL_RELEASED' → 'HELD'
'ROOM_FEE_SPLIT_RELEASED' → 'RELEASED'
'REFUNDED_TO_CUSTOMER' → 'REFUNDED'
```

---

## KEY IMPLEMENTATION RULES

### Status Transitions (Enforce These)
```
BOOKING:
PENDING → ACTIVE (on payment)
ACTIVE → COMPLETED (on deposit refund)
ACTIVE → CANCELLED (on cancellation)

PAYMENT:
INITIATED → HELD (on payment success)
HELD → RELEASED (on room fee release)
RELEASED → REFUNDED (on deposit refund)
HELD → REFUNDED (on cancellation)
```

### Derived States (Never Store These)
- Is checked in? → `checkInConfirmedAt !== null`
- Is checked out? → `checkOutTime !== null`
- Room fee released? → `payment.status === 'RELEASED' || payment.status === 'REFUNDED'`
- Deposit refunded? → `payment.status === 'REFUNDED'`

### Timing Logic (Critical)
```typescript
// Check-in confirmation timing:
checkInConfirmedAt = max(officialCheckInTime, now) + 30 minutes

// Room fee release timing:
roomFeeReleaseAt = checkInConfirmedAt + 1 hour

// Checkout timing:
checkOutConfirmedAt = max(officialCheckOutTime, now)
// OR auto at: officialCheckOutTime + 1 hour

// Deposit refund timing:
depositRefundAt = checkOutConfirmedAt + 2 hours
```

---

## TESTING CHECKLIST

### After Implementation, Test:
1. ✅ Payment flow → booking becomes ACTIVE
2. ✅ Realtor check-in confirmation → sets checkInConfirmedAt
3. ✅ Auto check-in fallback → works 30 min after check-in time
4. ❌ Guest manual check-in → SHOULD NOT EXIST
5. ✅ Room fee release → happens 1 hour after check-in
6. ✅ Realtor checkout confirmation → sets checkOutTime
7. ✅ Auto checkout → happens 1 hour after checkout time  
8. ❌ Guest checkout button → SHOULD NOT EXIST
9. ✅ Deposit refund → happens 2 hours after checkout
10. ✅ Cancellation → proper tier-based refunds
11. ✅ Status queries → use only 4 booking states
12. ✅ Idempotency → jobs don't duplicate transfers

---

## MIGRATION STATUS

### Database:
✅ Enums simplified
✅ Old data migrated
✅ Prisma Client regenerated

### Code:
🚧 Backend routes - NOT UPDATED
🚧 Backend services - NOT UPDATED  
🚧 Backend jobs - NOT UPDATED
🚧 Frontend components - NOT UPDATED

---

## NEXT STEPS

1. Update `checkinService.ts` - Remove guest manual check-in
2. Update `booking.routes.ts` - Remove guest checkout endpoint
3. Update all status checks in backend files
4. Update all status checks in frontend files
5. Test complete booking flow end-to-end
6. Deploy to staging
7. Monitor for edge cases

---

## ROLLBACK PLAN

If issues arise, database can be rolled back by:
1. Restoring from backup
2. Re-running old migrations
3. Reverting schema.prisma changes

**Note**: Current database is EMPTY after reset (test/dev data only).
Production deployment requires careful migration strategy.
