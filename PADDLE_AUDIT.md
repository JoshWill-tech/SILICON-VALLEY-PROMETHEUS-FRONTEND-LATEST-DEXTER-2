# Paddle Audit

Date: 2026-06-13
Repository: `/workspaces/SILICON-VALLEY-PROMETHEUS-FRONTEND-LATEST-JOSH-WILL`
Audit scope: all `paddle` / `Paddle` / `PADDLE` references, billing-related UI and routes, Supabase billing schema usage, billing env vars, and package dependencies.

## Pre-flight state

- Original branch at audit start: `main`
- Working branch for migration work: `feat/dodo-billing-migration`
- `git diff --stat` at audit start: clean working tree
- Baseline `npm run build`: failed because `next` is not installed in the shell environment
- Baseline `npm run lint`: failed because `eslint` is not installed in the shell environment

## High-signal findings

- The active Paddle runtime is concentrated in the billing dashboard, one checkout button component, one hook, one server helper, and four `/api/billing/*` routes.
- The existing Supabase billing schema is a single `public.subscriptions` table created by `supabase/migrations/20260525000000_billing_subscriptions.sql`.
- Subscription gating outside the billing page already depends on `public.subscriptions`; those reads must be migrated carefully.
- The pricing tier card visuals currently live in `components/billing/billing-dashboard.tsx`; plan metadata and the `"Get Started"` CTA labels live in `lib/billing-plans.ts`.
- `.env.example` is out of sync with the runtime code. The template uses `PADDLE_CLIENT_TOKEN` / `PADDLE_ENV`, while the code expects `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` / `NEXT_PUBLIC_PADDLE_ENVIRONMENT` and per-tier price IDs.

## Runtime billing code

| Path | Lines | Notes |
| --- | --- | --- |
| `components/billing/billing-dashboard.tsx` | 23, 25, 54, 59, 60, 63, 73, 107, 112, 118, 296 | Main billing page component. Initializes Paddle in-browser, opens saved-card checkout for subscription management, and renders plan CTAs. This is the primary pricing-tier UI surface to preserve visually. |
| `components/billing/paddle-checkout-button.tsx` | 6, 14, 19, 20, 23, 28, 29, 30, 32, 34, 35, 39, 43, 44, 50, 52, 53, 54, 67, 68, 69, 70, 74, 77, 79, 100, 101, 104, 105, 110, 118, 131, 135, 136, 140, 142, 143, 146, 147, 157, 158 | Dedicated Paddle checkout CTA component used by pricing cards. |
| `components/billing/billing-success-panel.tsx` | 36, 53, 85, 112, 113 | Post-checkout session confirmation UI with Paddle-specific copy and status handling. |
| `app/settings/billing/page.tsx` | 3, 19 | Billing route mounting `BillingDashboard`. |
| `app/settings/billing/success/page.tsx` | 13, 16 | Billing success route with Paddle-specific page copy. |
| `hooks/use-billing-data.ts` | 10, 107 | Billing hook stores `paddle_subscription_id` and fetches invoices from `/api/billing/invoices`. |
| `lib/paddle.ts` | 3, 7, 8, 9, 10, 13, 20, 21, 22, 27, 30, 31, 36, 39, 40, 43, 44, 47, 48, 51, 57, 58, 61, 67, 68 | Central Paddle server helper: API client, webhook secret, client token, environment, and per-tier price env mappings. |
| `app/api/billing/checkout/route.ts` | 8, 29, 34, 40, 44, 61, 63, 64, 79, 87, 88 | Creates Paddle transactions for pricing-tier checkout. |
| `app/api/billing/checkout-session/route.ts` | 4, 23, 26, 27, 52, 53 | Confirms checkout session state via Paddle transaction lookup. |
| `app/api/billing/invoices/route.ts` | 2, 16, 20, 24, 27, 28 | Fetches invoices through Paddle transactions by `paddle_customer_id`. |
| `app/api/billing/cancel/route.ts` | 2, 16, 20, 24, 27 | Cancels subscriptions in Paddle using `paddle_subscription_id`. |
| `app/api/billing/webhook/route.ts` | 5, 9, 12, 21, 25, 28, 31, 43, 52, 53, 61, 81, 82, 88, 96, 97 | Existing webhook receiver, signature verification, and `subscriptions` table upsert path. |

## Pricing, billing, and subscription UI surfaces

| Path | Lines | Notes |
| --- | --- | --- |
| `components/billing/billing-dashboard.tsx` | 49, 52, 94, 99, 100, 315, 348, 360, 412, 413, 417, 431, 432, 433, 434, 437, 441, 443, 481 | Holds the current free-tier status card, payment-method section, quick actions, and billing-history UI that the migration needs to wire dynamically without visual redesign. |
| `lib/billing-plans.ts` | 34, 60, 89, 96 | Pricing plan metadata, including the `"Get Started"` labels for Creator, Studio, and Cinema. |
| `app/settings/page.tsx` | 115, 122, 128 | Settings surface linking into billing. |
| `components/LandingHeader.tsx` | 66 | Non-billing `"Get Started"` CTA; not part of the billing migration target. |
| `components/mobile/MobileLanding.tsx` | 90 | Non-billing `"Get Started"` CTA; not part of the billing migration target. |

## Supabase schema and subscription-dependent backend reads

### Paddle schema definition

| Path | Lines | Notes |
| --- | --- | --- |
| `supabase/migrations/20260525000000_billing_subscriptions.sql` | 1, 7, 8, 10, 32 | Creates `public.subscriptions` with `paddle_subscription_id`, `paddle_customer_id`, `next_billing_date`, and the Paddle-specific index. |

### Subscription reads outside billing page

| Path | Lines | Notes |
| --- | --- | --- |
| `app/api/jobs/create/route.ts` | 20, 21, 26, 28, 30, 31 | AI job creation gate reads `public.subscriptions` and checks paid access. |
| `app/api/projects/[id]/assets/route.ts` | 108, 109, 114, 116, 117 | Storage/access tier logic reads `public.subscriptions`. |
| `lib/r2/project-source-multipart.ts` | 82, 83, 88, 92, 93 | Multipart upload/storage tier path reads `public.subscriptions`. |
| `lib/storage-limits.ts` | 28 | Maps Paddle plan IDs to storage tiers; comment explicitly references Paddle plan IDs. |

### Billing hook schema assumptions

| Path | Lines | Notes |
| --- | --- | --- |
| `hooks/use-billing-data.ts` | 10, 11, 25, 42, 107, 109, 112, 115, 129 | Assumes `paddle_subscription_id`, `next_billing_date`, and invoice shape fetched from Paddle-backed API routes. |

## Environment variables and dependencies

| Path | Lines | Notes |
| --- | --- | --- |
| `.env.example` | 5, 6, 7, 8, 9 | Contains Paddle env placeholders, but does not match current runtime variable names. |
| `package.json` | 32, 33 | Declares `@paddle/paddle-js` and `@paddle/paddle-node-sdk`. |
| `package-lock.json` | 21, 22, 2790, 2792, 2796, 2798 | Lockfile entries for Paddle packages. |
| `scripts/generate-paddle-client-token.ts` | 1, 25, 28, 36, 39, 40, 44, 50 | Utility script for server-side Paddle client token generation. |
| `scripts/test-paddle-key.ts` | 1, 21, 29, 33, 42 | Utility script for verifying Paddle API access. |

## Documentation, audit notes, and legal copy references

These are not functional billing runtime files, but they reference Paddle directly and should be updated or retired during final cutover.

| Path | Lines | Notes |
| --- | --- | --- |
| `AUDIT_REPORT.md` | 22, 159, 162, 187 | Existing audit doc mentions Paddle as payment provider and billing table owner. |
| `docs/paddle-local-testing.md` | 1, 3, 8, 17, 18, 19, 20, 21, 22, 23, 28, 29, 30, 31, 32, 36, 41, 44, 59, 63, 65 | Paddle-specific local testing guide. |
| `docs/audits/legal-pages-audit.md` | 9, 16, 26, 34, 36 | Legal content audit references Paddle language and buyer portal behavior. |
| `lib/migration/unified-platform-compliance-checklist.md` | 47 | Compliance checklist mentions Paddle-aligned refund copy. |
| `app/privacy/page.tsx` | 27, 60 | Privacy policy references Paddle for payments and subscription management. |
| `app/terms/page.tsx` | 43, 44, 131, 132 | Terms page references Paddle as merchant of record and billing portal. |
| `app/refund/page.tsx` | 10, 31, 32, 40 | Refund page references Paddle refunds and cancellation path. |
| `app/contact/page.tsx` | 33 | Contact page points billing support users to Paddle customer portal. |
| `app/(marketing)/privacy/page-v2.tsx` | 39, 58, 77 | Marketing privacy page references Paddle as payment processor. |
| `app/(marketing)/terms/page-v2.tsx` | 41, 46 | Marketing terms page references Paddle subscription management. |
| `app/(marketing)/refund-policy/page-v2.tsx` | 6, 14, 18, 19, 60, 63, 71, 77, 78, 79 | Marketing refund policy is Paddle-specific throughout. |

## Migration impact summary

### Must change for Dodo migration

- `components/billing/billing-dashboard.tsx`
- `components/billing/paddle-checkout-button.tsx`
- `components/billing/billing-success-panel.tsx`
- `hooks/use-billing-data.ts`
- `lib/paddle.ts`
- `app/api/billing/checkout/route.ts`
- `app/api/billing/checkout-session/route.ts`
- `app/api/billing/invoices/route.ts`
- `app/api/billing/cancel/route.ts`
- `app/api/billing/webhook/route.ts`
- `supabase/migrations/20260525000000_billing_subscriptions.sql` as legacy predecessor only; new migration required for Dodo tables and rename flow
- Subscription-gating readers that currently depend on `public.subscriptions`

### Must preserve visually

- Creator / Studio / Cinema pricing tier card structure in `components/billing/billing-dashboard.tsx`
- Existing plan metadata ordering and CTA labels in `lib/billing-plans.ts`
- Existing billing-page visual language and dark glassmorphism treatment

### Must update later, but not required for functional runtime first pass

- `.env.example`
- Paddle docs/scripts if they are no longer needed
- Legal and marketing copy still naming Paddle

## Audit completion status

Phase 1 audit is complete. Paddle references, billing UI touchpoints, schema dependencies, and environment/dependency entries have been inventoried with file paths and line numbers.
