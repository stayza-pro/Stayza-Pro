# Admin Dashboard - Complete Feature Analysis & Requirements

## 📊 BACKEND API STATUS - What Already Exists

### ✅ **1. REALTOR MANAGEMENT** (100% Complete)

#### Available APIs:
- `GET /api/admin/realtors` - Get all realtors with filters
- `POST /api/admin/realtors/:id/approve` - Approve realtor account
- `POST /api/admin/realtors/:id/reject` - Reject realtor account  
- `POST /api/admin/realtors/:id/suspend` - Suspend realtor (blocks all properties + cancels bookings)
- `PUT /api/admin/bookings/batch-suspend` - Batch suspend realtor bookings

#### Features Include:
- ✅ Filter by status (PENDING, APPROVED, REJECTED, SUSPENDED)
- ✅ Search by business name, email, realtor name
- ✅ Pagination (page, limit parameters)
- ✅ View realtor details (user info, properties count, registration data)
- ✅ Email notifications (approval, rejection, suspension)
- ✅ Automatic booking cancellation on suspension
- ✅ Audit logging for all actions

**Relevance:** Essential for platform quality control and safety. Prevents fraudulent or low-quality hosts.

---

### ✅ **2. CAC VERIFICATION MANAGEMENT** (100% Complete)

#### Available APIs:
- `POST /api/realtors/:id/approve-cac` - Approve CAC number (Admin only)
- `POST /api/realtors/:id/reject-cac` - Reject CAC number (Admin only)
- `POST /api/realtors/appeal-cac` - Appeal CAC rejection (Realtor)

#### Features Include:
- ✅ CAC verification status tracking (PENDING, APPROVED, REJECTED, SUSPENDED)
- ✅ Approve CAC → Enables property uploads
- ✅ Reject CAC → Suspends account for 30 days with appeal option
- ✅ Appeal system → Realtor can resubmit within 30 days
- ✅ Automatic account deletion after 30 days if no appeal
- ✅ Email notifications for approval/rejection/appeal
- ✅ Document upload URL tracking (CAC certificate)

**Relevance:** CRITICAL for Nigerian legal compliance. Verifies legitimate business registration. Prevents fraud and ensures only registered businesses can list properties.

---

### ✅ **3. PLATFORM ANALYTICS** (100% Complete)

#### Available APIs:
- `GET /api/admin/analytics?timeRange=30d` - Get comprehensive platform metrics

#### Features Include:
- ✅ **Overview Metrics:**
  - Total users, realtors (active, pending), properties (active, inactive)
  - Total bookings (completed, pending, cancelled)
  - Total revenue with growth percentage
  - Average rating & total reviews
  - Occupancy rate, conversion rate

- ✅ **Time Range Filters:**
  - Last 7 days, 30 days, 90 days, 1 year
  - Period-over-period comparison
  - Growth rate calculations

- ✅ **Trend Charts:**
  - Monthly bookings trend
  - Monthly revenue trend
  - Completed bookings trend

- ✅ **Breakdowns:**
  - Property types distribution (apartment, house, villa, etc.)
  - Top 10 locations by property count
  - Booking status distribution
  - Top realtors by revenue

**Relevance:** Business intelligence for strategic decisions. Monitor platform health, identify growth opportunities, track performance metrics.

---

### ✅ **4. COMMISSION & PAYOUT MANAGEMENT** (100% Complete)

#### Available APIs:
- `GET /api/admin/commission/platform-report` - Platform-wide commission report
- `GET /api/admin/commission/realtor/:realtorId` - Realtor-specific earnings report
- `GET /api/admin/commission/pending-payouts` - Get pending payouts
- `POST /api/admin/commission/payout/:paymentId` - Process payout to realtor

#### Features Include:
- ✅ Platform commission tracking (10% of all bookings)
- ✅ Total revenue, commissions earned, payouts made
- ✅ Pending payouts dashboard
- ✅ Individual realtor earnings breakdown
- ✅ Process payout with reference ID
- ✅ Date range filtering
- ✅ Pagination for large datasets
- ✅ Audit logging for payout processing

**Relevance:** Financial management core. Track platform revenue, manage realtor payments, ensure proper commission collection.

---

### ✅ **5. AUDIT LOGGING** (100% Complete)

#### Available APIs:
- `GET /api/admin/audit-logs` - Get audit logs with filters

#### Features Include:
- ✅ Log all admin actions (approve, reject, suspend, payout)
- ✅ Track who did what, when, and from where (IP address)
- ✅ Filter by action type, entity type, admin ID
- ✅ Pagination
- ✅ Timestamp tracking

**Relevance:** Accountability and security. Track admin actions for compliance, dispute resolution, and fraud prevention.

---

### ✅ **6. REFUND MANAGEMENT** (100% Complete)

#### Available APIs:
- `GET /api/refunds/admin/pending` - Get refund requests for admin processing
- `POST /api/refunds/:id/process` - Process approved refund

#### Features Include:
- ✅ Two-stage refund system:
  1. Guest requests refund
  2. Realtor approves/rejects
  3. Admin processes payment
- ✅ View pending refunds (realtor-approved only)
- ✅ Process refund with admin notes
- ✅ Filter by status, realtor
- ✅ Pagination

**Relevance:** Customer satisfaction and dispute resolution. Handle cancellations, process refunds, maintain trust.

---

## ❌ **MISSING BACKEND FEATURES** - What Needs to Be Built

### **1. USER MANAGEMENT** ❌

#### Why It's Needed:
- Monitor all platform users (guests, realtors, admins)
- Handle user disputes and complaints
- Suspend abusive users
- View user activity and history

#### Proposed APIs:
```
GET /api/admin/users - Get all users with filters
GET /api/admin/users/:id - Get user details
POST /api/admin/users/:id/suspend - Suspend user account
POST /api/admin/users/:id/unsuspend - Unsuspend user account
DELETE /api/admin/users/:id - Delete user account (with data handling)
```

**Priority:** MEDIUM - Not critical but useful for platform safety

---

### **2. REVIEW MODERATION** ❌

#### Why It's Needed:
- Remove fake or inappropriate reviews
- Handle review disputes
- Maintain platform integrity
- Respond to flagged reviews

#### Proposed APIs:
```
GET /api/admin/reviews - Get all reviews with filters
GET /api/admin/reviews/flagged - Get flagged reviews
POST /api/admin/reviews/:id/remove - Remove review
POST /api/admin/reviews/:id/flag - Flag review for review
GET /api/admin/reviews/:id/dispute - View review dispute
```

**Priority:** MEDIUM - Important for quality control

---

### **3. BOOKING OVERSIGHT** ❌

#### Why It's Needed:
- Monitor suspicious booking patterns
- Handle booking disputes
- View all platform bookings
- Cancel problematic bookings

#### Proposed APIs:
```
GET /api/admin/bookings - Get all bookings with advanced filters
GET /api/admin/bookings/:id - Get booking details
POST /api/admin/bookings/:id/cancel - Cancel booking (with refund)
GET /api/admin/bookings/disputes - View booking disputes
POST /api/admin/bookings/:id/resolve-dispute - Resolve dispute
```

**Priority:** HIGH - Important for customer service

---

### **4. PAYMENT MONITORING** ❌

#### Why It's Needed:
- Track failed payments
- Monitor payment patterns
- Handle payment disputes
- View payment analytics

#### Proposed APIs:
```
GET /api/admin/payments - Get all payments with filters
GET /api/admin/payments/failed - Get failed payments
GET /api/admin/payments/:id - Get payment details
POST /api/admin/payments/:id/refund - Initiate refund
GET /api/admin/payments/analytics - Payment analytics
```

**Priority:** HIGH - Critical for financial health

---

### **5. PLATFORM SETTINGS** ❌

#### Why It's Needed:
- Configure commission rates
- Manage platform policies
- Update email templates
- Enable/disable features

#### Proposed APIs:
```
GET /api/admin/settings - Get platform settings
PUT /api/admin/settings/commission-rate - Update commission rate
PUT /api/admin/settings/policies - Update platform policies
GET /api/admin/settings/email-templates - Get email templates
PUT /api/admin/settings/email-templates/:id - Update email template
```

**Priority:** MEDIUM - Nice to have for flexibility

---

### **6. SUPPORT TICKET SYSTEM** ❌

#### Why It's Needed:
- Handle customer support requests
- Track issue resolution
- Manage support team
- Monitor response times

#### Proposed APIs:
```
GET /api/admin/support/tickets - Get support tickets
GET /api/admin/support/tickets/:id - Get ticket details
POST /api/admin/support/tickets/:id/respond - Respond to ticket
POST /api/admin/support/tickets/:id/close - Close ticket
GET /api/admin/support/stats - Support analytics
```

**Priority:** HIGH - Critical for customer satisfaction

---

### **7. NOTIFICATION MANAGEMENT** ❌

#### Why It's Needed:
- Send platform-wide announcements
- Manage notification templates
- Track notification delivery
- Handle notification preferences

#### Proposed APIs:
```
POST /api/admin/notifications/broadcast - Send broadcast notification
GET /api/admin/notifications/templates - Get notification templates
PUT /api/admin/notifications/templates/:id - Update template
GET /api/admin/notifications/stats - Notification analytics
```

**Priority:** LOW - Nice to have for engagement

---

## 🎯 **RECOMMENDED IMPLEMENTATION PRIORITY**

### **PHASE 1: Core Admin Dashboard UI** (Week 1)
1. ✅ Admin Layout & Navigation
2. ✅ Dashboard Overview (Analytics + Metrics)
3. ✅ Realtor Management UI (List, Approve, Reject, Suspend)
4. ✅ CAC Verification UI (Approve, Reject, View Documents)
5. ✅ Commission & Payout UI (Reports, Process Payouts)

**Why:** All APIs exist. Just need UI. Critical for platform launch.

---

### **PHASE 2: Extended Management** (Week 2)
6. ❌ Build Support Ticket System (Backend + Frontend)
7. ❌ Build Payment Monitoring (Backend + Frontend)
8. ❌ Build Booking Oversight (Backend + Frontend)

**Why:** Essential for customer service and operations.

---

### **PHASE 3: Quality Control** (Week 3)
9. ❌ Build Review Moderation (Backend + Frontend)
10. ❌ Build User Management (Backend + Frontend)
11. ✅ Audit Logs UI (Backend exists, need UI)

**Why:** Important for platform quality and trust.

---

### **PHASE 4: Advanced Features** (Week 4)
12. ❌ Platform Settings (Backend + Frontend)
13. ❌ Notification Management (Backend + Frontend)
14. ❌ Reports & Export System (Backend + Frontend)

**Why:** Nice-to-have for flexibility and scalability.

---

## 📋 **ADMIN DASHBOARD PAGES TO BUILD**

### **1. Dashboard Overview** 🏠
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Key metrics cards (users, realtors, properties, bookings, revenue)
- Growth indicators (percentage change)
- Revenue trend chart (line chart)
- Booking trend chart (bar chart)
- Top performing realtors table
- Recent activity feed
- Quick action buttons

**APIs to Use:**
- `GET /api/admin/analytics`

---

### **2. Realtor Management** 👥
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Realtor list table (sortable, filterable)
- Status badges (Pending, Approved, Rejected, Suspended)
- Search bar (name, email, business name)
- Filter dropdown (status)
- Pagination
- View realtor details modal
- Approve/Reject/Suspend actions
- Bulk actions (select multiple)

**APIs to Use:**
- `GET /api/admin/realtors`
- `POST /api/admin/realtors/:id/approve`
- `POST /api/admin/realtors/:id/reject`
- `POST /api/admin/realtors/:id/suspend`

---

### **3. CAC Verification** 📄
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Pending CAC verifications table
- View CAC document (PDF/Image viewer)
- Business details display
- Approve/Reject with notes
- Rejection reason input
- Appeal tracking
- Suspension countdown (30 days)
- Document download button

**APIs to Use:**
- `GET /api/admin/realtors` (filter by cacStatus=PENDING)
- `POST /api/realtors/:id/approve-cac`
- `POST /api/realtors/:id/reject-cac`

**New UI Needed:**
- Document viewer component
- Approval confirmation modal
- Rejection reason form
- Appeal history timeline

---

### **4. Analytics Dashboard** 📊
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Time range selector (7d, 30d, 90d, 1y)
- Metric cards with growth indicators
- Line chart (revenue trend)
- Bar chart (booking trend)
- Pie chart (property types distribution)
- Map chart (top locations)
- Table (top realtors by revenue)
- Export to CSV button

**APIs to Use:**
- `GET /api/admin/analytics?timeRange=30d`

**Charts Library:** Recharts or Chart.js

---

### **5. Commission & Payouts** 💰
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Platform commission summary
- Pending payouts table
- Filter by realtor
- Process payout modal
- Payout reference input
- Payout history table
- Date range picker
- Export reports button

**APIs to Use:**
- `GET /api/admin/commission/platform-report`
- `GET /api/admin/commission/pending-payouts`
- `POST /api/admin/commission/payout/:paymentId`
- `GET /api/admin/commission/realtor/:realtorId`

---

### **6. Refund Management** 💸
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Pending refunds table
- Refund request details
- Guest & realtor info
- Booking details
- Realtor decision (approved/rejected)
- Process refund button
- Admin notes textarea
- Status tracking

**APIs to Use:**
- `GET /api/refunds/admin/pending`
- `POST /api/refunds/:id/process`

---

### **7. Audit Logs** 📝
**Status:** Backend Ready ✅ | Frontend Needed ❌

**Features:**
- Audit log table (sortable)
- Filter by action type
- Filter by admin
- Filter by entity type
- Date range filter
- Search by entity ID
- Action details modal
- IP address tracking
- Export logs button

**APIs to Use:**
- `GET /api/admin/audit-logs`

---

## 🎨 **UI/UX DESIGN REQUIREMENTS**

### **Design System:**
- **Primary Color:** #2563EB (Blue) - Trust, professionalism
- **Success Color:** #10B981 (Green) - Approvals, confirmations
- **Warning Color:** #F59E0B (Amber) - Pending, caution
- **Danger Color:** #EF4444 (Red) - Rejections, suspensions
- **Neutral Color:** #6B7280 (Gray) - Text, backgrounds

### **Components Needed:**
1. **MetricCard** - Display key metrics with growth indicators
2. **DataTable** - Sortable, filterable, paginated tables
3. **StatusBadge** - Color-coded status indicators
4. **ActionModal** - Confirmation dialogs for critical actions
5. **ChartCard** - Wrapper for charts with titles
6. **FilterPanel** - Multi-select filters with search
7. **DateRangePicker** - Date range selection
8. **DocumentViewer** - PDF/Image viewer for CAC documents
9. **SearchBar** - Global search with autocomplete
10. **NotificationToast** - Success/error notifications

### **Layout:**
- **Sidebar Navigation** (dark theme, collapsible)
- **Top Header** (admin info, notifications, logout)
- **Content Area** (white background, cards/tables)
- **Breadcrumbs** (navigation trail)

---

## 🔐 **SECURITY CONSIDERATIONS**

1. **Role-Based Access Control (RBAC)**
   - Only ADMIN role can access admin routes
   - Already implemented in middleware ✅

2. **Audit Logging**
   - All admin actions logged with user ID, timestamp, IP
   - Already implemented ✅

3. **Two-Factor Authentication**
   - Consider adding for admin accounts
   - Not yet implemented ❌

4. **IP Whitelisting**
   - Optional: Restrict admin access to specific IPs
   - Not yet implemented ❌

5. **Session Timeout**
   - Shorter timeout for admin sessions (15 minutes)
   - Consider implementing ❌

---

## 📈 **SUCCESS METRICS**

### **Admin Dashboard Should Achieve:**
1. **Realtor Approval Time:** < 24 hours from application to decision
2. **CAC Verification Time:** < 48 hours for document review
3. **Payout Processing Time:** < 72 hours from booking completion
4. **Refund Processing Time:** < 48 hours from realtor approval
5. **Support Response Time:** < 2 hours for urgent issues
6. **Platform Uptime:** 99.9% availability

---

## 🚀 **NEXT STEPS - START BUILDING**

### **Week 1 Focus:**
1. ✅ Build Admin Layout (sidebar, header, routing)
2. ✅ Build Dashboard Overview (metrics + charts)
3. ✅ Build Realtor Management UI
4. ✅ Build CAC Verification UI
5. ✅ Build Commission & Payout UI

### **Tools & Libraries:**
- **Framework:** Next.js 14 (App Router)
- **Charts:** Recharts
- **Tables:** TanStack Table
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Styling:** Tailwind CSS

---

## ✅ **FINAL SUMMARY**

### **What Exists (Backend):**
✅ Realtor Management (100%)
✅ CAC Verification (100%)
✅ Platform Analytics (100%)
✅ Commission & Payouts (100%)
✅ Audit Logging (100%)
✅ Refund Management (100%)

### **What Needs Frontend:**
❌ Dashboard Overview UI
❌ Realtor Management UI
❌ CAC Verification UI
❌ Analytics Dashboard UI
❌ Commission & Payout UI
❌ Refund Management UI
❌ Audit Logs UI

### **What Needs Backend + Frontend:**
❌ User Management
❌ Review Moderation
❌ Booking Oversight
❌ Payment Monitoring
❌ Support Tickets
❌ Platform Settings
❌ Notification Management

---

**Ready to start building? Let's focus on Phase 1 (Week 1) and build the core admin dashboard UI! 🚀**

Which page would you like me to start with?
1. **Dashboard Overview** (landing page with metrics)
2. **Realtor Management** (approve/reject/suspend)
3. **CAC Verification** (document review system)

