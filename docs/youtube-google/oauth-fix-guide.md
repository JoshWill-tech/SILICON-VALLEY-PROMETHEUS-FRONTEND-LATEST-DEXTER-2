# YouTube and Google OAuth Fix Guide
Date: 2026-06-08

## Symptom
Users see "Access blocked" during Google OAuth.

## Common Causes
- OAuth consent screen is still in Testing mode.
- App is requesting sensitive or restricted scopes without verification.
- Privacy policy or terms URL is missing from Google Cloud Console.
- Authorized domains do not include `prometheusstudio.tech`.
- Redirect URI does not match the app route.

## Fix Steps
1. Open Google Cloud Console.
2. Go to APIs & Services, OAuth consent screen.
3. Confirm the app is set to In production when ready for real users.
4. Add authorized domain: `prometheusstudio.tech`.
5. Add privacy policy URL: `https://prometheusstudio.tech/privacy`.
6. Add terms URL: `https://prometheusstudio.tech/terms`.
7. Confirm redirect URIs exactly match the production OAuth callback routes.
8. Review requested scopes and remove anything not required.
9. If using YouTube upload or Drive write scopes, submit for Google verification.
10. Upload a demo video that shows consent, channel display, user-selected upload, and disconnect.

## Limited Use Disclosure
The v2 privacy policy includes a Google API Services Limited Use disclosure covering YouTube Data API and Google Drive API. Keep that text live before submitting verification.

## Recommended Scope Positioning
- YouTube: publish selected videos to the user's channel and display channel identity.
- Google Drive: import/export user-selected files only.
- No advertising, retargeting, third-party profile building, or unrelated data transfer.
