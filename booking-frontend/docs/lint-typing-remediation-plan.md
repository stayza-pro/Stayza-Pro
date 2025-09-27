# Lint & Typing Remediation Plan

_Last updated: 2025-09-27_

## Snapshot of the current debt

The latest `npm run lint` run surfaces three main problem clusters:

1. **TypeScript strictness gaps**
   - Widespread `@typescript-eslint/no-explicit-any` violations across hooks (`useAuth`, `useProperties`), services (`api.ts`, `properties.ts`, `store/authStore.ts`), and booking/payment components.
   - Several files export helper functions without concrete domain types, making it hard to guarantee API compatibility.

2. **Code hygiene issues**
   - Dozens of unused imports/variables, especially icon imports in booking/payment/dashboard components, clutter diffs and hide real problems.
   - A handful of React lint complaints (unescaped entities) introduced by marketing copy tweaks.

3. **Next.js image guidance**
   - Repeated `@next/next/no-img-element` warnings in dashboard, booking, review, and property components indicate we are bypassing the framework’s built-in image optimization.

4. **Tooling alignment**
   - The workspace is on TypeScript **5.9.2** while `@typescript-eslint` is pinned to a version that only supports `< 5.4`, yielding a deprecation warning before linting even starts. This will block any effort to enforce stricter rules long-term.

## Proposed remediation phases

| Phase | Scope | Primary goals | Estimated effort |
| --- | --- | --- | --- |
| **0. Tooling upgrade** | `package.json`, ESLint config | Upgrade `@typescript-eslint/*` packages (and peers) to versions compatible with TypeScript 5.9, or temporarily pin TS to an officially supported version. Re-run lint to confirm rule parity. | 0.5 day |
| **1. Hygiene sweep** | Booking, dashboard, payment, property components | Remove unused imports/variables, escape problematic copy, and resolve trivial warnings. No behavioral changes. | 1 day |
| **2. Image modernization** | Components rendering `<img>` | Replace `<img>` tags with `next/image` (or document exceptions), configure placeholder/priority props where appropriate. Validate responsive layouts. | 1–1.5 days |
| **3. Typing hardening** | Hooks, stores, services | Replace `any` with domain models (`Property`, `Booking`, `User`, etc.). Leverage existing Prisma types or shareable DTOs. Refactor caller code if signatures change. | 3–4 days |
| **4. Prevent regressions** | Repo setup | Enable `next lint --max-warnings=0` in CI, add a lightweight PR checklist, and consider turning on TypeScript `noImplicitAny` (if not already) after Phase 3. | 0.5 day |

## Suggested execution order

1. **Agree on tooling direction**: decide whether to upgrade `@typescript-eslint` or temporarily peg TypeScript to 5.3.x. (Upgrade is preferred to keep React 18/Next 14 compatible.)
2. **Batch quick wins**: tackle unused imports and copy escapes across affected directories. This gives immediate signal reduction and smaller diffs for later phases.
3. **Refactor image usage**: centralize image helpers if necessary (e.g., create `<ResponsiveImage>` wrapper) to minimize repetitive props.
4. **Introduce typed contracts**: adopt or generate shared types from backend Prisma schema/API responses. Consider using `zod` or `io-ts` for runtime validation if payloads come from the backend.
5. **Guard rails**: add lint/type checks to CI and enforce zero-warning policy post-cleanup.

## Dependencies & risks

- **Backend contracts**: replacing `any` will likely require aligning with backend DTOs. Coordinate with backend maintainers before locking types.
- **Design review**: converting `<img>` to `Image` may require layout tweaks; plan for QA on marketing and dashboard pages.
- **CI impact**: stricter linting will fail current builds until the backlog is cleared; stage the change with feature branches or temporary ignore files.

## Recommended team allocation

- Assign a **frontend lead** to own tooling upgrades and hygiene sweep.
- Distribute typing fixes by domain (booking, payments, dashboards) to domain owners to avoid blockers.
- Involve **design/UX** during the image modernization pass to confirm visual parity.

## Milestone proposal

- **Week 1:** Complete Phase 0 & 1.
- **Week 2:** Execute Phase 2, begin Phase 3 focusing on shared hooks/services.
- **Week 3:** Finish Phase 3, enable Phase 4 guard rails, and monitor PRs for regressions.

## Tracking & follow-up

- Create tickets per phase (or per directory) in the project tracker.
- Update this document as work progresses, noting dates and responsible engineers.
- Once lint runs clean, lock the configuration and treat new warnings as release blockers.
