# Payout System Testing Guide

## Test Status: December 29, 2025

### Environment Setup
✅ Backend Server: Running on http://localhost:5050
✅ Frontend Server: Running on http://localhost:3001
✅ Database: PostgreSQL on localhost:5000
✅ Paystack API: Test keys configured

---

## Test Plan

### 1. Database Schema Verification

**Test:** Check if payout fields exist in database

```sql
-- Run this in your PostgreSQL client
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'realtors' 
AND column_name IN ('paystackSubAccountCode', 'flutterwaveSubAccountCode');
```

**Expected Result:**
- `paystackSubAccountCode` - character varying - YES
- `flutterwaveSubAccountCode` - character varying - YES

---

### 2. Backend API Endpoint Tests

#### Test 2.1: Get Banks List (No Auth Required)
```bash
curl -X GET "http://localhost:5050/api/realtors/payout/banks" \
  -H "Content-Type: application/json"
```

**Expected Result:**
- Status: 200 OK
- Response contains array of Nigerian banks
- Each bank has: `id`, `name`, `code`, `active`

---

#### Test 2.2: Verify Bank Account (Requires Auth)
```bash
curl -X POST "http://localhost:5050/api/realtors/payout/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN" \
  -d '{
    "accountNumber": "0123456789",
    "bankCode": "058"
  }'
```

**Expected Result:**
- Status: 200 OK
- Response contains: `account_number`, `account_name`, `bank_id`

---

#### Test 2.3: Save Bank Account (Requires Auth + CAC Approval)
```bash
curl -X POST "http://localhost:5050/api/realtors/payout/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN" \
  -d '{
    "bankCode": "058",
    "bankName": "Guaranty Trust Bank",
    "accountNumber": "0123456789",
    "accountName": "Test Realtor"
  }'
```

**Expected Result:**
- Status: 200 OK
- Response contains: `subAccountCode`, `bankName`, `accountNumber`
- Database updated with `paystackSubAccountCode`

**Error Cases to Test:**
- ❌ No CAC approval → 403 "CAC verification must be approved"
- ❌ Missing fields → 400 "All bank account fields are required"
- ❌ Invalid account → 400 from Paystack

---

#### Test 2.4: Get Payout Settings
```bash
curl -X GET "http://localhost:5050/api/realtors/payout/settings" \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Response: `{ hasPayoutAccount: true/false, subAccountCode: "..." }`

---

#### Test 2.5: Get Pending Payouts
```bash
curl -X GET "http://localhost:5050/api/realtors/payouts/pending" \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Response contains:
  - `pendingPayouts[]` - Array of released but untransferred funds
  - `totalPending` - Sum of all pending amounts
  - `hasPayoutAccount` - Boolean

---

#### Test 2.6: Get Payout History
```bash
curl -X GET "http://localhost:5050/api/realtors/payouts/history" \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN"
```

**Expected Result:**
- Status: 200 OK
- Response contains:
  - `history[]` - Array of completed/processing/failed payouts
  - Each item has: `id`, `amount`, `status`, `createdAt`, `reference`

---

#### Test 2.7: Request Manual Payout
```bash
curl -X POST "http://localhost:5050/api/realtors/payouts/request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN" \
  -d '{
    "amount": 50000
  }'
```

**Expected Result:**
- Status: 200 OK
- Response contains: `amount`, `reference`, `estimatedCompletion`
- Admin notification created

**Error Cases:**
- ❌ No bank account → 400 "Please set up your bank account"
- ❌ Amount > available → 400 "Requested amount exceeds available balance"
- ❌ No pending funds → 400 "No funds available for withdrawal"

---

### 3. Frontend UI Tests

#### Test 3.1: Settings Page - Payout Tab

**Steps:**
1. Login as realtor
2. Navigate to http://localhost:3001/settings?tab=payout
3. Verify UI elements:
   - [ ] Bank dropdown is visible
   - [ ] Account number input is visible
   - [ ] Verify button is visible
   - [ ] Account name field (read-only)
   - [ ] Save button is visible

**If CAC not approved:**
- [ ] Warning banner shows "CAC Verification Required"
- [ ] All inputs are disabled

**If CAC approved:**
- [ ] No warning banner
- [ ] All inputs are enabled

**Test Flow:**
1. Select a bank from dropdown → bankCode updates
2. Enter 10-digit account number → validates digits only
3. Click "Verify" → Shows loading spinner
4. After verification → Account name auto-fills
5. Click "Save Bank Account" → Shows loading spinner
6. On success → Shows green success banner
7. After save → All inputs become disabled
8. Success message: "Payout Account Active"

---

#### Test 3.2: Payouts Page

**Steps:**
1. Navigate to http://localhost:3001/payouts
2. Check loading state → Shows spinner
3. After load, verify sections:

**If No Bank Account:**
- [ ] Warning banner at top shows "Bank Account Setup Required"
- [ ] CTA button "Set Up Bank Account" is visible
- [ ] Clicking redirects to /settings?tab=payout

**If Bank Account Exists:**
- [ ] No warning banner at top
- [ ] Summary cards show:
  - Pending Balance (₦0 or actual amount)
  - Total Paid Out
  - Pending Requests
- [ ] "Request Withdrawal" button shows total amount
- [ ] Button disabled if totalPending = 0
- [ ] Button enabled if totalPending > 0

**Pending Payouts Section:**
- [ ] Only shows if pendingPayouts.length > 0
- [ ] Lists individual escrow releases
- [ ] Shows property title, booking ID, amount
- [ ] Shows "Cleaning Fee" or "Room Fee (90%)"
- [ ] Shows "Released X time ago"

**Payout History Section:**
- [ ] Always visible
- [ ] Shows "No payout history yet" if empty
- [ ] Lists completed/processing/failed transfers
- [ ] Shows status badges with icons
- [ ] Shows reference numbers
- [ ] Shows timestamps

---

### 4. Integration Tests

#### Test 4.1: Complete Flow (Happy Path)

**Prerequisites:**
- Realtor account exists
- CAC approved
- Escrow funds released (from test booking)

**Steps:**
1. **Setup Bank Account:**
   - Go to Settings → Payout tab
   - Select bank: GTBank (058)
   - Enter account: 0123456789
   - Click Verify → Account name appears
   - Click Save → Success message
   - Verify database: `paystackSubAccountCode` is set

2. **Check Available Balance:**
   - Go to Payouts page
   - Verify no warning banner
   - Check "Pending Balance" card shows amount > 0
   - Verify pending payouts list shows items

3. **Request Withdrawal:**
   - Click "Request Withdrawal" button
   - Confirm dialog appears
   - Click confirm
   - Success message shows
   - History updates with new PROCESSING entry

4. **Verify Backend State:**
   - Check database: Payment records have `realtorTransferInitiated` timestamp
   - Check: Admin notification created
   - Pending balance should decrease

---

#### Test 4.2: Error Scenarios

**Test 4.2.1: Try to set up without CAC approval**
- Expected: Warning banner, inputs disabled, error on save

**Test 4.2.2: Try invalid account number**
- Expected: Verification fails, error message shown

**Test 4.2.3: Try to request payout without bank account**
- Expected: Error "Please set up your bank account in Settings first"

**Test 4.2.4: Try to request more than available**
- Expected: Error "Requested amount exceeds available balance"

---

### 5. Escrow Auto-Transfer Test

**Setup:**
1. Create test booking with realtor who has subaccount
2. Process booking to CONFIRMED
3. Trigger check-in → Cleaning fee released
4. Wait for escrow job (runs every 5 minutes)

**Expected:**
- Escrow job runs
- Checks for `paystackSubAccountCode`
- Calls `paystackService.initiateTransfer()`
- Updates payment with `realtorTransferInitiated` timestamp
- Creates notification for realtor

**If No Subaccount:**
- Logs warning
- Marks payment metadata with `transferFailed: true`
- Funds remain "released" but not transferred

---

## Test Checklist Summary

### Backend (7/7)
- [x] Database schema includes payout fields
- [x] GET /payout/banks endpoint
- [x] POST /payout/verify endpoint
- [x] POST /payout/account endpoint (creates subaccount)
- [x] GET /payout/settings endpoint
- [x] GET /payouts/pending endpoint
- [x] POST /payouts/request endpoint

### Frontend (4/4)
- [x] Payout service with all methods
- [x] Settings page - Payout tab UI
- [x] Payouts page with conditional warning
- [x] Navigation to payouts page

### Integration (0/5)
- [ ] End-to-end bank account setup
- [ ] Pending payouts display correctly
- [ ] Manual withdrawal request works
- [ ] Escrow auto-transfer when subaccount exists
- [ ] Error handling for no subaccount

---

## Manual Testing Instructions

### Quick Test (5 minutes)

1. **Start servers:**
   ```bash
   # Terminal 1 - Backend
   cd booking-backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd booking-frontend && npm run dev
   ```

2. **Login as realtor:**
   - Go to http://localhost:3001
   - Login with realtor credentials
   
3. **Test Settings Page:**
   - Navigate to Settings → Payout tab
   - Check if CAC warning appears (if not approved)
   - Try selecting a bank
   - Enter test account number
   - Click Verify (may need real account for Paystack)

4. **Test Payouts Page:**
   - Navigate to Payouts from sidebar
   - Check if warning appears (if no bank account)
   - Click "Set Up Bank Account" button
   - Verify redirect to Settings

### Full Test (30 minutes)

Follow all steps in section 4.1 "Complete Flow (Happy Path)"

---

## Environment Variables Check

Ensure these are set in `.env`:

```env
# Backend
PAYSTACK_SECRET_KEY=sk_test_***
PAYSTACK_PUBLIC_KEY=pk_test_***
DATABASE_URL=postgresql://***
JWT_SECRET=***

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5050/api
```

---

## Known Issues & Limitations

1. **Test Mode:** Using Paystack test keys - need real keys for production
2. **Bank Verification:** Requires real Nigerian bank account numbers
3. **Subaccount Creation:** Limited by Paystack API rate limits
4. **Manual Transfers:** Require admin intervention (no auto-processing)

---

## Next Steps After Testing

1. ✅ Verify all green checkmarks above
2. ✅ Test with real bank account (in test mode)
3. ✅ Test escrow auto-transfer with real booking
4. ✅ Verify Paystack dashboard shows subaccounts
5. ✅ Test error handling edge cases
6. ✅ Performance test with multiple concurrent requests
7. ✅ Security audit of sensitive data handling

---

**Test Date:** December 29, 2025  
**Tester:** [Your Name]  
**Environment:** Development  
**Status:** Ready for Testing ✅
