# Frontend Issue Log

Use this file during each test session. Keep issues short, reproducible, and linked.

## Session Info

- Date:
- Environment: `local` | `staging` | `production`
- Build/Commit:
- Tester:

## Issue Severity Scale

- `P0`: blocks critical booking/payment/auth path.
- `P1`: major feature broken but workaround exists.
- `P2`: medium bug or clear UX regression.
- `P3`: visual polish/minor inconsistency.

## Issue Type

- `Design`: layout, spacing, typography, color, animation, responsiveness.
- `Technical`: logic, API, auth, state, performance, console/network errors.
- `Mixed`: both design + technical effects.

## Root-Cause Cluster Labels

Use one cluster per issue so linked bugs are easy to sort:

- `AUTH_ROUTING`
- `DATE_TIME_PICKER`
- `AVAILABILITY_PRICING`
- `BOOKING_LIFECYCLE`
- `PAYMENT_VERIFICATION`
- `DISPUTE_WINDOWS`
- `IMAGE_LOADING_FIT`
- `HYDRATION_SSR`
- `THEME_STYLING`
- `DATA_REFRESH_SYNC`

## Open Issues

| ID | Severity | Type | Cluster | Route | Title | Repro Steps | Expected | Actual | Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| FE-001 | P2 | Design | DATE_TIME_PICKER | `/guest/browse/[id]` |  | 1. 2. 3. |  |  | screenshot/console link | Open |

## Notes Per Issue

### FE-001

- Timestamp:
- Browser + device:
- API endpoint involved (if any):
- Console error (exact):
- Network status code (if any):
- Linked issues:
- Suspected cause:
- Fix candidate:
- Retest result:

## Fixed / Retested

| ID | Fix Commit | Retest Date | Retest Result | Notes |
|---|---|---|---|---|
