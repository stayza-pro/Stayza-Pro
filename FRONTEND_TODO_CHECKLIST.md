# 📋 STAYZA FRONTEND - ACTIONABLE TODO CHECKLIST

**Last Updated:** January 10, 2025  
**Priority System:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low  
**Platform Type:** 🎨 **WHITE-LABEL Multi-Tenant SaaS**

---

## 🎨 WHITE-LABEL PLATFORM NOTES

**Remember:** Stayza is a white-label platform where:
- Main domain: **stayza.pro** (platform admin only)
- Each realtor gets: **[their-choice].stayza.pro** subdomain (e.g., loligoing.stayza.pro)
- Subdomain chosen during registration ✅ Already implemented
- Guests see **only the realtor's brand**, never "Stayza"
- Realtors customize: logo, colors, tagline, business info
- Each realtor manages their properties independently
- Platform provides: infrastructure, payments, analytics behind the scenes

**Key White-Label Features to Implement:**
- 🎨 Brand customization UI (colors, logo, tagline) - **Missing**
- 👁️ Live preview of guest booking site - **Missing**
- 📧 Branded email templates - **Missing**
- 🔧 Guest site feature toggles (enable/disable reviews, wishlists, etc.) - **Future**

**Note:** Custom domain feature NOT needed - subdomain model is sufficient ✅

---

## 🔴 CRITICAL - DO FIRST (This Week)

### Dashboard Structure
- [ ] Create `src/app/(realtor)/dashboard/properties/page.tsx` - Property list
- [ ] Create `src/app/(realtor)/dashboard/properties/new/page.tsx` - Add property
- [ ] Create `src/app/(realtor)/dashboard/properties/[id]/page.tsx` - Edit property
- [ ] Create `src/app/(realtor)/dashboard/bookings/page.tsx` - Booking management
- [ ] Create `src/app/(realtor)/dashboard/payments/page.tsx` - Payment history
- [ ] Create `src/app/(realtor)/dashboard/reviews/page.tsx` - Review management

### Replace Mock Data
- [ ] Fix `RealtorDashboard.tsx` - Replace hardcoded stats with API calls
  - [ ] Fetch real property count from `GET /api/properties/host/:hostId`
  - [ ] Fetch real booking count from `GET /api/bookings/realtor-bookings`
  - [ ] Calculate real revenue from payment data
  - [ ] Fetch real ratings from review API

### Property Management UI
- [ ] Create `PropertyList` component with:
  - [ ] Property cards/table view
  - [ ] Search and filter functionality
  - [ ] Pagination
  - [ ] Add property button
- [ ] Create `PropertyForm` component for add/edit:
  - [ ] Multi-step form (details, photos, pricing, availability)
  - [ ] Image upload with preview
  - [ ] Form validation
  - [ ] Submit to `POST /api/properties` or `PUT /api/properties/:id`
- [ ] Add delete property functionality with confirmation modal

---

## 🟠 HIGH PRIORITY (Next Week)

### Booking Management
- [ ] Create `BookingManagement` component:
  - [ ] Booking list with status filters
  - [ ] Date range picker
  - [ ] Status badges (pending, confirmed, cancelled, completed)
  - [ ] Booking detail modal/page
- [ ] Add booking actions:
  - [ ] Approve/Reject booking
  - [ ] Update booking status
  - [ ] Cancel booking with reason
  - [ ] View guest details
- [ ] Connect to `GET /api/bookings/realtor-bookings`
- [ ] Connect to `PUT /api/bookings/:id/status`

### Payment Dashboard
- [ ] Create `PaymentHistory` component:
  - [ ] Payment transactions table
  - [ ] Filter by date, status, property
  - [ ] Payment detail view
  - [ ] Export to CSV functionality
- [ ] Create revenue summary cards:
  - [ ] Total earnings
  - [ ] Pending payouts
  - [ ] This month's revenue
  - [ ] Commission breakdown
- [ ] Connect to `GET /api/payments` API
- [ ] Add payment receipt download

### Refund Management
- [ ] Create `RefundList` component:
  - [ ] Refund requests table
  - [ ] Status indicators
  - [ ] Guest information
- [ ] Add refund actions:
  - [ ] Approve refund (realtor decision)
  - [ ] Reject refund with reason
  - [ ] View refund details
- [ ] Connect to refund APIs:
  - [ ] `GET /api/refunds/realtor-refunds`
  - [ ] `PATCH /api/refunds/:id/realtor-decision`

---

## 🟡 MEDIUM PRIORITY (Week 3)

### Review Management
- [ ] Create `ReviewManagement` component:
  - [ ] Review list with filters (property, rating, date)
  - [ ] Review cards with guest info
  - [ ] Rating distribution chart
  - [ ] Photo gallery for reviews
- [ ] Add review actions:
  - [ ] Respond to reviews
  - [ ] Flag inappropriate reviews
  - [ ] View review history
- [ ] Connect to review APIs:
  - [ ] `GET /api/reviews/realtor/:realtorId/reviews`
  - [ ] `POST /api/reviews/:id/response`
  - [ ] `PATCH /api/reviews/:id/flag`

### Analytics Dashboard
- [ ] **Backend:** Create realtor analytics endpoint
  - [ ] `GET /api/analytics/realtor/:realtorId`
  - [ ] Return: bookings trend, revenue trend, occupancy rate, top properties
- [ ] **Frontend:** Create `AnalyticsDashboard` component:
  - [ ] Revenue chart (line/bar chart)
  - [ ] Booking trends chart
  - [ ] Occupancy rate gauge
  - [ ] Property performance table
  - [ ] Date range selector
- [ ] Install charting library: `npm install recharts`
- [ ] Create reusable chart components

### Real-time Notifications
- [ ] Fix Socket.IO bundling issue in `NotificationProvider.tsx`
  - [ ] Remove TODO comment on line 30
  - [ ] Re-enable socket connection
  - [ ] Test bundling
- [ ] Connect to backend socket events:
  - [ ] New booking notification
  - [ ] Payment received notification
  - [ ] New review notification
  - [ ] Booking cancellation notification
- [ ] Add notification sound/badge
- [ ] Test real-time updates

---

## 🟢 LOWER PRIORITY (Week 4+)

### Email Verification
- [ ] Create `src/app/(realtor)/verify-email/page.tsx`
- [ ] Add email verification success page
- [ ] Add email verification failure page
- [ ] Add "Resend Verification" button
- [ ] Connect to `POST /api/auth/resend-verification`
- [ ] Show verification status in profile

### Password Reset Flow
- [ ] Create `src/app/(realtor)/forgot-password/page.tsx`
- [ ] Create `src/app/(realtor)/reset-password/page.tsx`
- [ ] Add password strength indicator
- [ ] Add form validation
- [ ] Connect to password reset APIs:
  - [ ] `POST /api/auth/forgot-password`
  - [ ] `POST /api/auth/reset-password`
- [ ] Add success/error messages

### Profile Management
- [ ] Create `src/app/(realtor)/dashboard/profile/page.tsx`
- [ ] Add profile edit form:
  - [ ] Personal info section
  - [ ] Business info section (agency name, tagline, description)
  - [ ] Logo/Avatar upload (for white-label branding)
  - [ ] Brand color customization (primary, secondary, accent)
  - [ ] CAC document upload
  - [ ] Password change
- [ ] Add **white-label preview component**:
  - [ ] Live preview of guest booking site with current branding
  - [ ] Preview on desktop/mobile/tablet views
  - [ ] Show how logo, colors, tagline appear to guests
- [ ] Connect to profile APIs:
  - [ ] `GET /api/realtors/profile`
  - [ ] `PUT /api/realtors/profile`
  - [ ] `PUT /api/auth/profile`

### Settings Page
- [ ] Create `src/app/(realtor)/dashboard/settings/page.tsx`
- [ ] Add settings tabs:
  - [ ] Account settings
  - [ ] Notification preferences
  - [ ] Billing settings
  - [ ] Privacy settings
  - [ ] **White-label settings:**
    - [ ] Custom domain setup (if purchased)
    - [ ] Guest site feature toggles
    - [ ] Social media links (for guest site)
    - [ ] Contact information display
    - [ ] Terms & privacy links
- [ ] Connect to settings APIs:
  - [ ] `GET /api/notifications/preferences`
  - [ ] `PUT /api/notifications/preferences`

### Availability Calendar
- [ ] Install calendar library: `npm install react-calendar date-fns`
- [ ] Create `AvailabilityCalendar` component:
  - [ ] Interactive calendar view
  - [ ] Block/unblock dates
  - [ ] Recurring availability patterns
  - [ ] Special pricing for specific dates
- [ ] Connect to `PUT /api/properties/:id/availability`

---

## 🛠️ TECHNICAL DEBT (Week 5)

### TypeScript Improvements
- [ ] Upgrade TypeScript ESLint packages:
  ```bash
  npm install -D @typescript-eslint/parser@^6.0.0 @typescript-eslint/eslint-plugin@^6.0.0
  ```
- [ ] Remove all `any` types:
  - [ ] `src/hooks/useAuth.ts`
  - [ ] `src/hooks/useProperties.ts`
  - [ ] `src/services/api.ts`
  - [ ] `src/store/authStore.ts`
- [ ] Create shared types from Prisma schema
- [ ] Add Zod for runtime validation: `npm install zod`

### Code Cleanup
- [ ] Run `npm run lint` and fix all warnings
- [ ] Remove unused imports:
  - [ ] Booking components
  - [ ] Payment components
  - [ ] Dashboard components
- [ ] Fix unescaped React entities in marketing copy
- [ ] Replace `<img>` tags with `next/image`:
  - [ ] Dashboard components
  - [ ] Property components
  - [ ] Review components

### API Response Type Fixes
- [ ] Update `ApiResponse<T>` interface in `src/types/index.ts`:
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }
  ```
- [ ] Update all service methods to use correct response structure
- [ ] Add type guards for API responses

### Performance Optimization
- [ ] Install React Query: `npm install @tanstack/react-query`
- [ ] Add React Query provider to app
- [ ] Replace direct API calls with React Query hooks:
  - [ ] Properties
  - [ ] Bookings
  - [ ] Payments
  - [ ] Reviews
- [ ] Add loading skeletons to all lists
- [ ] Implement pagination on all data lists
- [ ] Optimize images with Next.js Image component
- [ ] Add service worker for offline support

---

## 📦 PACKAGE INSTALLATIONS NEEDED

```bash
# Charts for analytics
npm install recharts

# Better date handling
npm install date-fns

# Calendar component
npm install react-calendar

# Runtime validation
npm install zod

# Better data fetching
npm install @tanstack/react-query

# File upload
npm install react-dropzone

# TypeScript ESLint upgrades
npm install -D @typescript-eslint/parser@^6.0.0 @typescript-eslint/eslint-plugin@^6.0.0
```

---

## 📊 PROGRESS TRACKING

### Week 1: Dashboard Foundation
- [ ] 0/6 Dashboard routes created
- [ ] 0/4 Mock data replaced with real API
- [ ] 0/3 Property management components

**Target:** 100% completion by end of week

### Week 2: Booking & Payments
- [ ] 0/4 Booking management tasks
- [ ] 0/4 Payment dashboard tasks
- [ ] 0/3 Refund management tasks

**Target:** 100% completion by end of week

### Week 3: Reviews & Analytics
- [ ] 0/4 Review management tasks
- [ ] 0/5 Analytics dashboard tasks
- [ ] 0/4 Real-time notifications tasks

**Target:** 100% completion by end of week

### Week 4: Missing Features
- [ ] 0/6 Email verification tasks
- [ ] 0/6 Password reset tasks
- [ ] 0/6 Profile management tasks
- [ ] 0/6 Settings page tasks
- [ ] 0/5 Availability calendar tasks

**Target:** 80% completion by end of week

### Week 5: Technical Debt
- [ ] 0/5 TypeScript improvements
- [ ] 0/4 Code cleanup tasks
- [ ] 0/3 API response type fixes
- [ ] 0/7 Performance optimization tasks

**Target:** 90% completion by end of week

---

## 🎯 DAILY STANDUP FORMAT

### What I completed yesterday:
- [ ] Task 1
- [ ] Task 2

### What I'm working on today:
- [ ] Task 1
- [ ] Task 2

### Blockers:
- None / List any blockers

### Estimated completion:
- Current task: X hours remaining
- Current phase: X% complete

---

## 📝 NOTES

- Mark tasks as complete with `[x]`
- Add notes or issues inline with task
- Update progress percentages daily
- Review and adjust priorities weekly
- Celebrate wins! 🎉

---

**Start Date:** January 10, 2025  
**Target Completion:** February 14, 2025 (5 weeks)  
**Last Updated:** January 10, 2025
