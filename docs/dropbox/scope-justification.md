# Dropbox Scope Justification
Date: 2026-06-08

## App
Prometheus Studio is an AI-assisted video editing workspace. Dropbox integration is used only when a user explicitly connects Dropbox to import source media into a project or export a finished render to their Dropbox account.

## Requested Scopes
| Scope | Required | Justification |
|-------|----------|---------------|
| `account_info.read` | Yes | Displays the connected Dropbox account identity so users can confirm they connected the correct account. |
| `files.content.read` | Yes | Lets users select and import Dropbox media files into Prometheus Studio projects. |
| `files.content.write` | Yes | Lets users export completed videos back to Dropbox when they explicitly choose Dropbox as an export destination. |

## Scopes Not Requested
Prometheus Studio should not request team, sharing, full Dropbox, contacts, or admin scopes. The app does not need access to private messages, team administration, or files that the user does not select for import/export.

## Data Handling
- Dropbox access is user-initiated through OAuth.
- Prometheus Studio stores only the access token, refresh token if required, expiration time, and minimal account metadata.
- Imported files are used only for the selected project.
- Exported files are uploaded only after the user chooses Dropbox as the destination.
- Tokens are deleted when the user disconnects Dropbox in Settings, Social Accounts.

## Review Notes
Use `https://prometheusstudio.tech/privacy` and `https://prometheusstudio.tech/terms` after the v2 pages are swapped live. The website must remain live and accessible without authentication during review.
