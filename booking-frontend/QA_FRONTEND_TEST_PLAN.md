# Frontend QA Workflow (Linked-Issue Order)

Use this exact order so related problems surface together instead of randomly.

## 1. Session Setup

- [ ] Run frontend with the intended env (`.env.local` for local, production URL for deployed checks).
- [ ] Confirm API base URL is correct in browser network calls.
- [ ] Open DevTools tabs: `Console`, `Network`, and `Performance`.
- [ ] Start with a clean state: hard refresh, clear stale local storage tokens if auth behavior looks inconsistent.

## 2. Pass A: Routing + Auth Foundation

Routes to test:
- [ ] `/guest/login`
- [ ] `/guest/register`
- [ ] `/guest/browse`
- [ ] `/realtor/login`
- [ ] `/admin/login`

Checks:
- [ ] Role redirects are correct (guest/realtor/admin).
- [ ] `returnTo` behavior works.
- [ ] No 403/404 due to wrong API host.
- [ ] No hydration console errors on first load.

## 3. Pass B: Browse + Calendar/Time UX

Routes to test:
- [ ] `/guest/browse`
- [ ] `/guest/browse/[id]`

Checks:
- [ ] Date picker header is aligned.
- [ ] No broken `Next Month` label text.
- [ ] Past dates are not selectable.
- [ ] Unavailable/booked dates are not clickable.
- [ ] Check-out cannot be before/equals check-in.
- [ ] Date/time dropdown animation is smooth and consistent.
- [ ] Hero/gallery images use proper fit and smooth loading.

## 4. Pass C: Checkout + Payment

Routes to test:
- [ ] `/booking/[propertyId]/checkout`
- [ ] `/booking/[propertyId]/payment`
- [ ] `/booking/payment/success`

Checks:
- [ ] Guest auth guard redirects and returns correctly.
- [ ] Price breakdown is consistent from browse to checkout.
- [ ] Payment init does not fail for retryable bookings.
- [ ] Payment verification fallback works.
- [ ] Receipt availability follows policy.

## 5. Pass D: Guest Booking Lifecycle

Routes to test:
- [ ] `/guest/bookings`
- [ ] `/guest/bookings/[id]`
- [ ] `/guest/bookings/[id]/checkout`

Checks:
- [ ] Check-in only available on official check-in day.
- [ ] Checkout only after check-in.
- [ ] Extension action is not available.
- [ ] Reduction flow only allows reducing checkout date.
- [ ] Dispute window status matches actionable buttons.
- [ ] Open dispute works when window is open.

## 6. Pass E: Realtor Operations

Routes to test:
- [ ] `/bookings`
- [ ] `/bookings/[id]`
- [ ] `/properties/new`
- [ ] `/dashboard/properties/[id]`
- [ ] `/notifications`

Checks:
- [ ] Sidebar navigation feels instant (no blocking fetch lag).
- [ ] Calendar/time controls in add property are consistent with guest flow.
- [ ] Amenities comma-split behavior works.
- [ ] Realtor cannot use guest-only restricted flows with same role email.

## 7. Pass F: Admin Moderation + System Health

Routes to test:
- [ ] `/admin/reviews`
- [ ] `/admin/disputes`
- [ ] `/admin/system-health`

Checks:
- [ ] Moderation actions refresh state immediately.
- [ ] Webhook and lock actions return clear feedback.
- [ ] No role leakage or dead links.

## 8. Cross-Cutting Visual/Technical Sweep

- [ ] Light theme consistency on guest booking pages.
- [ ] Currency formatting is naira-only and symbol-rendered correctly.
- [ ] No mojibake symbols.
- [ ] All data-critical pages auto-refresh on focus/reconnect and polling.
- [ ] No React minified hydration errors in console.

## 9. Exit Criteria

- [ ] Every failed check logged in `QA_FRONTEND_ISSUE_LOG.md`.
- [ ] Each issue has reproduction steps + expected vs actual result.
- [ ] Linked issues grouped under one root-cause cluster.
- [ ] Retest status recorded after each fix.
