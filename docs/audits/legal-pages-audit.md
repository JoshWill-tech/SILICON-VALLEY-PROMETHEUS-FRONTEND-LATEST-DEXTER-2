# Legal Pages Audit
Date: 2026-06-08
Auditor: Codex

## Summary
- Existing live pages reviewed: `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/refund/page.tsx`.
- New additive v2 pages created under `app/(marketing)/.../page-v2.tsx`.
- Live routes were not modified.
- Primary risk: current live pages are decent for generic SaaS, but incomplete for social app review and Paddle-aligned refund language.

## Existing Privacy Page Gaps
| Requirement | Current Status | V2 Fix |
|-------------|----------------|--------|
| Google API Limited Use disclosure | Missing | Added dedicated Google API Services Limited Use section. |
| Social platform token usage | Too thin | Added token storage, no private messages/friend lists, explicit posting only, disconnect deletion. |
| Data sharing matrix | Partial | Added Paddle, Supabase, Cloudflare R2, social platforms, AssemblyAI, Groq, analytics. |
| CCPA/CPRA opt-out | Missing explicit wording | Added Do Not Sell or Share language and support contact. |
| Data retention detail | Partial | Added account, project, media, OAuth token, analytics, and deletion timing. |
| Children privacy | Missing | Added under-16 statement. |
| Security detail | Partial | Added transport/storage encryption, token protection, access controls, SOC 2 readiness statement. |

## Existing Terms Page Gaps
| Requirement | Current Status | V2 Fix |
|-------------|----------------|--------|
| Social platform integrations | Missing/insufficient | Added user-initiated social publishing section and third-party platform responsibility. |
| Paddle billing wording | Present | Expanded cancellation and buyer portal handling. |
| Acceptable use for social spam/bots | Partial | Added no bots, no spam, no scraping, no platform policy evasion. |
| Liability for platform suspension | Missing | Added limitation language covering third-party platform suspension. |
| Content ownership | Present | Preserved and clarified user ownership. |

## Existing Refund Page Gaps
| Requirement | Current Status | V2 Fix |
|-------------|----------------|--------|
| Paddle Merchant of Record | Present | Expanded Paddle's role for tax, buyer support, invoices, refunds. |
| Cooling-off period | Mentions statutory rights but broad 30-day guarantee | Reframed around 14-day first-payment refund/cooling-off period plus case-by-case review after 14 days. |
| Cancellation process | Partial | Added Settings, Billing and Paddle buyer portal instructions. |
| Post-14-day eligibility | Missing | Added technical issues, outages, billing errors, and exclusions. |
| Processing timeline | Present | Preserved 5 to 10 business day expectation. |

## Platform Review Gaps Fixed
- Dropbox: scope justification, demo script, resubmission email.
- TikTok: app review package and demo script with visible legal-link requirement.
- YouTube/Google: OAuth blocked troubleshooting and verification checklist.
- LinkedIn: account recovery guide and app review package.
- Facebook/Instagram: appeal template and deferral strategy.
- X: developer application guide.

## Migration Checklist
1. Review v2 legal text with counsel before publishing.
2. Rename or copy `app/(marketing)/privacy/page-v2.tsx` into the live privacy route.
3. Rename or copy `app/(marketing)/terms/page-v2.tsx` into the live terms route.
4. Rename or copy `app/(marketing)/refund-policy/page-v2.tsx` into the live refund route or create a redirect from `/refund-policy` to `/refund`.
5. Make Privacy and Terms visible in the public footer without requiring a menu.
6. Update platform developer portals with live URLs.
7. Record demo videos using the scripts in `docs/dropbox` and `docs/tiktok`.
8. Add `PlatformStatusBanner` to the social publishing UI.

## Notes
The v2 pages avoid negative framing while still being honest about platform data use, refunds, consumer rights, and third-party integrations.
