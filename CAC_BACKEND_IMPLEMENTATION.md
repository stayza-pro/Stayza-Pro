# CAC Verification Backend Implementation

## Overview
Comprehensive backend API for Corporate Affairs Commission (CAC) verification workflow with complete email notification system.

## Database Schema (Prisma)
Already exists in `prisma/schema.prisma`:

```prisma
enum CacStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

model Realtor {
  cacStatus           CacStatus @default(PENDING)
  cacVerifiedAt       DateTime?
  cacRejectedAt       DateTime?
  cacRejectionReason  String?
  canAppeal           Boolean   @default(true)
  suspendedAt         DateTime?
  corporateRegNumber  String?
  cacDocumentUrl      String?
  // ... other fields
}
```

## API Endpoints Implemented

### Realtor Endpoints

#### 1. Submit CAC Verification
**POST** `/api/realtors/cac`
- **Auth:** Bearer Token (REALTOR role)
- **Body:**
  ```json
  {
    "cacNumber": "RC123456",
    "cacDocumentUrl": "https://cloudinary.com/..."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "CAC verification submitted successfully",
    "data": {
      "cacStatus": "PENDING",
      "cacNumber": "RC123456"
    }
  }
  ```
- **Validation:**
  - Checks if already approved (prevents duplicate submissions)
  - Resets rejection fields on new submission
  - Sets `canAppeal` to false (fresh submission doesn't need appeal)

---

#### 2. Get CAC Status
**GET** `/api/realtors/cac/status`
- **Auth:** Bearer Token (REALTOR role)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "cacStatus": "REJECTED",
      "cacNumber": "RC123456",
      "cacDocumentUrl": "https://...",
      "cacVerifiedAt": null,
      "cacRejectedAt": "2025-01-15T10:30:00Z",
      "cacRejectionReason": "Document unclear, please upload high-resolution scan",
      "canAppeal": false
    }
  }
  ```
- **Use Case:** Display current verification state in settings page

---

#### 3. Resubmit CAC After Rejection
**PUT** `/api/realtors/cac/resubmit`
- **Auth:** Bearer Token (REALTOR role)
- **Body:**
  ```json
  {
    "cacNumber": "RC123456",
    "cacDocumentUrl": "https://cloudinary.com/new-document.pdf"
  }
  ```
- **Validation:**
  - Status must be `REJECTED`
  - `canAppeal` must be `true` (email appeal link clicked first)
- **Response:**
  ```json
  {
    "success": true,
    "message": "CAC verification resubmitted successfully",
    "data": {
      "cacStatus": "PENDING",
      "cacNumber": "RC123456"
    }
  }
  ```
- **Workflow:** Resets status to PENDING, clears rejection fields

---

#### 4. Process Appeal from Email Link
**GET** `/api/realtors/cac/appeal/:token`
- **Auth:** None (public email link)
- **Parameters:** `token` - Realtor ID (simplified, use JWT in production)
- **Action:**
  - Sets `canAppeal = true` for realtor
  - Redirects to dashboard: `https://{slug}.stayza.pro/settings?tab=business&appeal=success`
- **Security Note:** In production, use encrypted JWT tokens with expiry

---

### Admin Endpoints

#### 5. Approve CAC Verification
**PUT** `/api/admin/realtor/:realtorId/cac/approve`
- **Auth:** Bearer Token (ADMIN role)
- **Action:**
  - Updates status to `APPROVED`
  - Sets `cacVerifiedAt` timestamp
  - Clears rejection fields
  - Sends approval email to realtor
  - Logs action in `AuditLog` table
- **Email Sent:** `sendCacApprovalEmail()` - Welcome to verified status, can now upload properties

---

#### 6. Reject CAC Verification
**PUT** `/api/admin/realtor/:realtorId/cac/reject`
- **Auth:** Bearer Token (ADMIN role)
- **Body:**
  ```json
  {
    "reason": "CAC certificate image is blurry. Please upload a high-resolution scan showing the registration number clearly."
  }
  ```
- **Action:**
  - Updates status to `REJECTED`
  - Sets `cacRejectedAt` timestamp
  - Stores `cacRejectionReason`
  - Sets `canAppeal = false` (requires email appeal first)
  - Generates appeal token (realtor ID)
  - Sends rejection email with appeal link
  - Logs action in `AuditLog` table
- **Email Sent:** `sendCacRejectionEmail()` with appeal button

---

## Email Templates

### 1. CAC Approval Email
**Function:** `sendCacApprovalEmail(to, name, businessName)`
- **Subject:** "✅ CAC Verification Approved - Start Uploading Properties!"
- **Content:**
  - Congratulations message
  - "What This Means" info box (success style)
  - CTA button → Dashboard
  - Support contact info
- **Brand:** Stayza gradient header, branded colors

---

### 2. CAC Rejection Email
**Function:** `sendCacRejectionEmail(to, name, businessName, reason, appealUrl)`
- **Subject:** "❌ CAC Verification Requires Attention - Appeal Available"
- **Content:**
  - Polite rejection notice
  - Rejection reason in warning info box
  - "What Happens Next?" section with steps
  - CTA button → Start Appeal Process (opens appeal URL)
  - Appeal link expiry notice (7 days)
  - Support contact info
- **Appeal Flow:**
  1. Realtor clicks "Start Appeal Process"
  2. Redirected to dashboard with `?tab=business&appeal=success`
  3. Frontend detects `appeal=success`, shows success toast
  4. Realtor can now upload corrected CAC document
  5. Calls `/cac/resubmit` endpoint

---

## Workflow Diagrams

### Happy Path: CAC Approval
```
1. Realtor submits CAC → POST /api/realtors/cac
   Status: PENDING
   
2. Admin reviews in admin dashboard
   
3. Admin approves → PUT /api/admin/realtor/:id/cac/approve
   Status: APPROVED
   cacVerifiedAt: 2025-01-15T10:00:00Z
   
4. Email sent: "CAC Verification Approved"
   
5. Realtor can now upload properties (requireApprovedRealtor middleware passes)
```

---

### Rejection & Appeal Flow
```
1. Realtor submits CAC → POST /api/realtors/cac
   Status: PENDING
   canAppeal: false
   
2. Admin reviews and finds issue
   
3. Admin rejects → PUT /api/admin/realtor/:id/cac/reject
   Status: REJECTED
   cacRejectionReason: "Document unclear..."
   canAppeal: false (prevents direct resubmission)
   
4. Email sent: "CAC Verification Requires Attention"
   Appeal URL: http://localhost:5000/api/realtors/cac/appeal/{realtorId}
   
5. Realtor clicks appeal link in email
   → GET /api/realtors/cac/appeal/{token}
   canAppeal: true (enabled)
   Redirects to: https://{slug}.stayza.pro/settings?tab=business&appeal=success
   
6. Frontend shows success toast: "Appeal processed. You can now resubmit your CAC documentation."
   
7. Realtor uploads corrected document
   → PUT /api/realtors/cac/resubmit
   Status: PENDING (back to step 1)
   canAppeal: false (reset)
```

---

## Security Considerations

### Current Implementation (Development)
- Appeal token = Realtor ID (plain text)
- **Risk:** Predictable tokens, anyone with realtor ID can enable appeal

### Production Improvements Needed
```typescript
// Generate secure appeal token
import jwt from 'jsonwebtoken';

const appealToken = jwt.sign(
  { realtorId: realtor.id, purpose: 'cac_appeal' },
  config.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify appeal token
const decoded = jwt.verify(token, config.JWT_SECRET);
if (decoded.purpose !== 'cac_appeal') {
  throw new AppError('Invalid appeal token', 400);
}
```

---

## Error Handling

### Common Error Responses

#### 1. CAC Already Approved
```json
{
  "success": false,
  "message": "CAC verification already approved"
}
```
**Scenario:** Realtor tries to submit CAC when status is already APPROVED

---

#### 2. Appeal Not Verified
```json
{
  "success": false,
  "message": "Please complete the appeal process before resubmitting"
}
```
**Scenario:** Realtor tries to resubmit without clicking email appeal link

---

#### 3. Invalid Status for Resubmission
```json
{
  "success": false,
  "message": "CAC resubmission only allowed after rejection"
}
```
**Scenario:** Realtor tries to resubmit when status is PENDING or APPROVED

---

#### 4. Rejection Reason Required
```json
{
  "success": false,
  "message": "Rejection reason is required"
}
```
**Scenario:** Admin tries to reject CAC without providing reason

---

## Audit Logging

All admin actions are logged in `AuditLog` table:

### CAC Approval Log
```typescript
await prisma.auditLog.create({
  data: {
    userId: req.user.id, // Admin user ID
    action: "CAC_APPROVED",
    resource: "REALTOR",
    resourceId: realtorId,
    metadata: {
      realtorId: realtor.id,
      businessName: realtor.businessName,
      cacNumber: realtor.corporateRegNumber
    }
  }
});
```

### CAC Rejection Log
```typescript
await prisma.auditLog.create({
  data: {
    userId: req.user.id, // Admin user ID
    action: "CAC_REJECTED",
    resource: "REALTOR",
    resourceId: realtorId,
    metadata: {
      realtorId: realtor.id,
      businessName: realtor.businessName,
      cacNumber: realtor.corporateRegNumber,
      reason: reason
    }
  }
});
```

**Use Case:** Admin dashboard can show "Who approved this realtor?" and "Why was this rejected?"

---

## Integration Points

### Frontend Settings Page (To Be Built)
```typescript
// src/app/(realtor)/settings/page.tsx - Business & CAC Tab

// 1. Fetch CAC status on mount
const { data } = await fetch('/api/realtors/cac/status');

// 2. Display based on status
if (data.cacStatus === 'PENDING') {
  // Show: "Verification in progress" with spinner
} else if (data.cacStatus === 'APPROVED') {
  // Show: Green checkmark, "Verified" badge, verified date
} else if (data.cacStatus === 'REJECTED') {
  // Show: Rejection reason in red alert
  // If canAppeal is false: "Check your email for appeal instructions"
  // If canAppeal is true: Show resubmission form
}

// 3. Handle query param from appeal redirect
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('appeal') === 'success') {
    showSuccess('Appeal processed! You can now resubmit your CAC documentation.');
  }
}, []);

// 4. Submit/Resubmit handlers
const handleSubmit = async (formData) => {
  const endpoint = data.cacStatus === 'REJECTED' 
    ? '/api/realtors/cac/resubmit' 
    : '/api/realtors/cac';
  
  const method = data.cacStatus === 'REJECTED' ? 'PUT' : 'POST';
  
  const response = await fetch(endpoint, {
    method,
    body: JSON.stringify({
      cacNumber: formData.cacNumber,
      cacDocumentUrl: formData.documentUrl
    })
  });
};
```

---

### Admin Dashboard (To Be Built)
```typescript
// Admin CAC Review Interface

// 1. Fetch all pending CAC verifications
const { data } = await fetch('/api/admin/realtors?cacStatus=PENDING');

// 2. Display realtor details + CAC document viewer
<RealtorCard>
  <BusinessInfo />
  <CacDocumentViewer url={realtor.cacDocumentUrl} />
  <div className="actions">
    <Button onClick={() => handleApprove(realtor.id)}>
      ✅ Approve CAC
    </Button>
    <Button onClick={() => setRejectModalOpen(true)}>
      ❌ Reject CAC
    </Button>
  </div>
</RealtorCard>

// 3. Rejection modal with reason textarea
<RejectModal>
  <textarea 
    placeholder="Explain why this CAC is being rejected. Be specific so the realtor knows how to correct it."
  />
  <Button onClick={() => handleReject(realtor.id, reason)}>
    Send Rejection & Appeal Email
  </Button>
</RejectModal>
```

---

## Testing the API

### Test CAC Submission (cURL)
```bash
curl -X POST http://localhost:5000/api/realtors/cac \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cacNumber": "RC123456",
    "cacDocumentUrl": "https://res.cloudinary.com/demo/image/upload/v1234/cac-cert.pdf"
  }'
```

### Test Admin Approval
```bash
curl -X PUT http://localhost:5000/api/admin/realtor/REALTOR_ID/cac/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Admin Rejection
```bash
curl -X PUT http://localhost:5000/api/admin/realtor/REALTOR_ID/cac/reject \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "CAC document is not legible. Please provide a clear, high-resolution scan."
  }'
```

### Test Appeal Link
```bash
# Copy appeal URL from rejection email, paste in browser
# Should redirect to: https://{slug}.stayza.pro/settings?tab=business&appeal=success
```

### Test Resubmission
```bash
curl -X PUT http://localhost:5000/api/realtors/cac/resubmit \
  -H "Authorization: Bearer YOUR_REALTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cacNumber": "RC123456",
    "cacDocumentUrl": "https://res.cloudinary.com/demo/image/upload/v5678/cac-cert-corrected.pdf"
  }'
```

---

## Email Preview Screenshots
(To be added after frontend implementation)

### Approval Email
![CAC Approval Email](#)
- Green success theme
- Clear CTA to dashboard
- Professional Stayza branding

### Rejection Email
![CAC Rejection Email](#)
- Warning/orange theme
- Prominent appeal button
- Clear rejection reason
- Support contact info

---

## Next Steps

### Phase 1: Type Definitions (Task #4)
✅ **Priority:** HIGH  
Add CAC fields to Realtor type in frontend:
```typescript
// src/types/index.ts
export interface Realtor {
  // ... existing fields
  cacStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  cacVerifiedAt?: string;
  cacRejectedAt?: string;
  cacRejectionReason?: string;
  canAppeal: boolean;
  corporateRegNumber?: string;
  cacDocumentUrl?: string;
}
```

### Phase 2: Settings Page Frontend (Task #1)
✅ **Priority:** HIGH  
Build comprehensive settings page with 6 tabs:
1. **Profile** - Personal info
2. **Branding** - Logo, colors
3. **Business & CAC** - CAC verification workflow (use new endpoints)
4. **Payout Settings** - Bank account for Paystack split
5. **Notifications** - Email preferences
6. **Security** - Password, 2FA

### Phase 3: Admin Dashboard CAC Review
Build admin interface for reviewing CAC submissions:
- List all pending CAC verifications
- Document viewer with zoom/download
- Approve/Reject buttons with reason modal
- Audit log view

### Phase 4: Production Security Hardening
- Replace plain realtor ID tokens with JWT
- Add token expiry (7 days)
- Add CSRF protection for appeal links
- Rate limiting on CAC submission endpoints

---

## File Locations

### Backend Files
- **Controller:** `/booking-backend/src/controllers/cacController.ts`
- **Routes:** `/booking-backend/src/routes/realtorRoutes.ts` (CAC routes added)
- **Email Service:** `/booking-backend/src/services/email.ts` (sendCacApprovalEmail, sendCacRejectionEmail)
- **Schema:** `/booking-backend/prisma/schema.prisma` (CacStatus enum, Realtor model)
- **Config:** `/booking-backend/src/config/index.ts` (NODE_ENV for environment detection)

### Documentation
- **This File:** `/CAC_BACKEND_IMPLEMENTATION.md`

---

## Summary
✅ **Completed:** Full backend CAC verification system with 6 API endpoints, 2 email templates, appeal workflow, audit logging  
⏳ **Next:** Update frontend type definitions (#4), then build comprehensive settings page (#1) with CAC verification UI  
🔒 **Security Note:** Replace plain token IDs with JWT in production  

---

**Created:** January 2025  
**Status:** Backend Complete, Frontend Pending  
**Version:** 1.0
