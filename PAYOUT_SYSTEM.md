# Semi-Automatic Payout & Escrow System

## System Overview
**Type**: Semi-Automatic with Escrow Control  
**Last Updated**: December 29, 2025

---

## 💰 Payment Flow

### 1. **Guest Makes Payment**
- **100% of payment** goes to platform's Paystack account initially
- **Paystack subaccount** configured with `percentageCharge: 10%`
- Platform automatically keeps **10% commission**
- Remaining **90%** held by platform for escrow control

---

## 🔄 Automatic Fund Releases (Via Cron Jobs)

### **Cleaning Fee** ✅ Immediate
- **Released**: Immediately after payment verification
- **To**: Realtor (100% of cleaning fee)
- **Trigger**: Payment status = COMPLETED
- **Job**: `cleaningFeeReleaseJob.ts`

### **Service Fee** ✅ Immediate  
- **Released**: Immediately after payment verification
- **To**: Platform (100% of service fee)
- **Trigger**: Payment status = COMPLETED

### **Room Fee** ⏰ 1 Hour After Check-In
- **Released**: 1 hour after `checkInTime` 
- **To**: Realtor (90%) + Platform (10%)
- **Condition**: No active dispute opened
- **Job**: `roomFeeReleaseJob.ts` (runs every 5 minutes)
- **Calculation**: 
  - Realtor: `roomFee * 0.90`
  - Platform: `roomFee * 0.10`

### **Security Deposit** ⏰ 4 Hours After Checkout
- **Released**: 4 hours after `checkOutTime`
- **To**: Guest (refund to original payment method)
- **Condition**: No damages reported, no dispute
- **Job**: `depositRefundJob.ts` (runs every 5 minutes)
- **Window**: Realtor has 4 hours to report damages with photo evidence

---

## 🖱️ Manual Withdrawals (Realtor-Initiated)

### Setup (One-Time)
1. Realtor navigates to **Settings → Payouts**
2. Enters bank account details (account number, bank code)
3. System verifies account with Paystack
4. System creates Paystack subaccount with 10% platform charge
5. Subaccount code saved to realtor profile

### Withdrawal Process
1. Realtor navigates to **Payouts** page
2. System displays:
   - Available balance (all released funds not yet transferred)
   - Pending funds (still in escrow, waiting for release timer)
   - Withdrawal history
3. Realtor clicks **"Request Withdrawal"**
4. System validates:
   - Bank account is set up
   - Funds are available (released but not transferred)
   - Amount doesn't exceed available balance
5. **Instant Transfer**:
   - System calls `paystackService.initiateTransfer()`
   - Transfers funds from platform to realtor's bank account
   - Updates payment records with transfer reference
   - Creates notification for realtor
6. **No admin approval needed** - fully automated

### Error Handling
- If transfer fails, payment marked as `transferFailed: true`
- Realtor notified to retry or contact support
- Failed transfers shown in history with retry option

---

## ⚖️ Dispute Resolution Flow

### Dispute Opened
- **All timers paused** for affected booking
- Funds remain in escrow until resolution
- Room fee release job skips disputed bookings
- Deposit refund job skips disputed bookings

### Dispute Resolved (Admin Decision)

#### **Guest Wins**
1. Refund amount calculated based on tier:
   - **TIER_1_SEVERE**: 100% room fee refund
   - **TIER_2_MODERATE**: 50% room fee refund  
   - **TIER_3_MINOR**: 25% room fee refund
2. Automatic Paystack refund to guest
3. Remaining funds (if any) released to realtor
4. Security deposit refunded to guest
5. Escrow events logged for all transactions

#### **Realtor Wins**
1. Full room fee released to realtor (90%)
2. Platform keeps commission (10%)
3. Security deposit handling:
   - If damages reported: Deduct from deposit, refund remainder
   - If no damages: Full deposit refunded to guest
4. All transfers automatic via Paystack API

---

## 📊 Escrow Event Tracking

Every fund movement creates an `EscrowEvent` record:

```typescript
{
  bookingId: string;
  eventType: 
    | "RELEASE_CLEANING_FEE"      // Immediate
    | "RELEASE_ROOM_FEE_SPLIT"    // After 1-hour window
    | "REFUND_DEPOSIT"             // After 4-hour window or dispute
    | "PARTIAL_REFUND"             // Dispute resolution
    | "DEDUCT_FROM_DEPOSIT";       // Damage deduction
  amount: Decimal;
  fromParty: "GUEST" | "ESCROW" | "PLATFORM";
  toParty: "REALTOR" | "GUEST" | "PLATFORM";
  executedAt: DateTime;
  transactionReference: string;
}
```

---

## 🔧 Technical Implementation

### Cron Jobs (Every 5 Minutes)
```typescript
// src/jobs/escrowJobs.ts
import cron from 'node-cron';

// Runs: */5 * * * * (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  await processCleaningFeeReleases();  // Immediate
  await processRoomFeeReleases();      // 1 hour after check-in
  await processDepositRefunds();       // 4 hours after checkout
});
```

### Paystack Integration
```typescript
// Subaccount Setup
createSubAccount({
  percentageCharge: 10, // Platform commission
  settlement_bank: bankCode,
  account_number: accountNumber
});

// Manual Transfer
initiateTransfer({
  amount: withdrawalAmount,
  recipient: realtorSubAccountCode,
  reference: `manual_payout_${realtorId}_${timestamp}`,
  reason: "Manual withdrawal"
});
```

### Database Fields (Payment Model)
```prisma
model Payment {
  // Escrow tracking
  roomFeeInEscrow: Boolean
  depositInEscrow: Boolean
  roomFeeReleasedAt: DateTime?
  depositReleasedAt: DateTime?
  
  // Payout tracking (new)
  realtorTransferInitiated: DateTime?
  realtorTransferCompleted: DateTime?
  realtorTransferReference: String?
  transferFailed: Boolean
  
  // Breakdown
  cleaningFeePaidOut: Boolean
  serviceFeeCollected: Boolean
  roomFeeSplitDone: Boolean
  depositRefunded: Boolean
}
```

---

## 🎯 Key Benefits

1. **For Realtors**
   - One-time bank setup
   - Instant withdrawals (no admin delays)
   - Transparent balance tracking
   - Automatic escrow releases

2. **For Platform**
   - Full escrow control (dispute handling)
   - Automatic commission collection (10%)
   - Reduced manual processing
   - Complete audit trail via EscrowEvents

3. **For Guests**
   - Protected during dispute window (1 hour)
   - Automatic deposit refunds (4 hours)
   - Fair dispute resolution process
   - Transparent refund tracking

---

## ⚠️ Important Notes

1. **Subaccount Percentage**: Must remain at 10% (platform commission)
2. **Escrow Control**: Platform holds 90% for timed releases and manual payouts
3. **No Double Splitting**: Don't mix automatic subaccount splits with manual escrow splits
4. **Dispute Window**: Critical for guest protection (1 hour) and deposit claims (4 hours)
5. **Transfer References**: Must be unique and idempotent to prevent duplicate transfers

---

## 🔍 Monitoring & Logs

All payout operations logged with:
- Realtor ID
- Amount
- Transfer reference
- Paystack transfer ID
- Success/failure status
- Error messages (if failed)

Check logs at: `logs/combined.log`
