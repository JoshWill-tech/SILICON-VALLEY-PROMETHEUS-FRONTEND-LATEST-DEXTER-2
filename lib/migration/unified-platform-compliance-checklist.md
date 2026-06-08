# Unified Platform Compliance Migration Checklist
Date: 2026-06-08

## New Files
- `components/marketing/legal-page-shell.tsx`
- `components/editor/social/platform-status-banner.tsx`
- `app/(marketing)/privacy/page-v2.tsx`
- `app/(marketing)/terms/page-v2.tsx`
- `app/(marketing)/refund-policy/page-v2.tsx`
- `docs/dropbox/scope-justification.md`
- `docs/dropbox/demo-video-script.md`
- `docs/dropbox/resubmission-email.md`
- `docs/tiktok/app-review-package.md`
- `docs/tiktok/demo-video-script.md`
- `docs/youtube-google/oauth-fix-guide.md`
- `docs/youtube-google/verification-checklist.md`
- `docs/linkedin/account-recovery-guide.md`
- `docs/linkedin/app-review-package.md`
- `docs/facebook/appeal-template.md`
- `docs/facebook/alternative-strategy.md`
- `docs/x-twitter/application-guide.md`
- `docs/audits/legal-pages-audit.md`

## Exact Swap Plan
| Current live file | V2 source | Action after approval |
|-------------------|-----------|-----------------------|
| `app/privacy/page.tsx` | `app/(marketing)/privacy/page-v2.tsx` | Replace live page contents after legal approval. |
| `app/terms/page.tsx` | `app/(marketing)/terms/page-v2.tsx` | Replace live page contents after legal approval. |
| `app/refund/page.tsx` | `app/(marketing)/refund-policy/page-v2.tsx` | Replace live page contents after legal approval. |
| Social publishing status UI | `components/editor/social/platform-status-banner.tsx` | Add banner above platform publishing controls. |

## Public Site Requirements
- Privacy and Terms links must be visible without opening a mobile menu.
- Website must be live during every platform review.
- Do not use a login page as the website URL for TikTok or Google verification.
- Contact email must be visible: support@prometheusstudio.tech.

## Platform Portal Updates
- Dropbox: reduce scopes and upload resubmission docs.
- TikTok: verify domain and upload demo video.
- Google: move OAuth consent screen out of Testing only after verification readiness.
- LinkedIn: submit recovery or new business developer account package.
- Meta: appeal or defer; do not show Facebook/Instagram as operational.
- X: apply with public legal URLs and rate-limit language.

## Deprecation After Approval
- Deprecate broad 30-day refund copy if Paddle alignment is approved.
- Deprecate privacy copy missing Limited Use and social-token disclosures.
- Deprecate terms copy missing social platform integration rules.
