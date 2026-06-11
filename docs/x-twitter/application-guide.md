# X Developer Application Guide
Date: 2026-06-08

## App Summary
Prometheus Studio is an AI-assisted video editing workspace. The X integration lets a user publish a completed video or caption to their own X account after explicit confirmation.

## Developer Portal Checklist
- [ ] Accept current X Developer Agreement.
- [ ] Add public website URL: `https://prometheusstudio.tech`.
- [ ] Add privacy policy URL: `https://prometheusstudio.tech/privacy`.
- [ ] Add terms URL: `https://prometheusstudio.tech/terms`.
- [ ] Configure callback URL for the production OAuth route.
- [ ] Request only scopes required for user-directed posting and account identity.
- [ ] Document rate-limit behavior and retry strategy.

## Use Case Description
Prometheus Studio helps creators and businesses edit video content. Users may connect X to publish a completed export or caption. Publishing is never automatic. The user selects the content, reviews the caption, and clicks Publish.

## Data Handling
- Store only OAuth token details, expiration, and basic account identity.
- Delete tokens immediately when disconnected.
- Do not use X data for advertising or third-party profiling.
- Respect X rate limits and surface failures honestly.

## Demo Video Requirements
Show OAuth connection, connected account identity, user-selected publish, rate-limit-safe status handling, and disconnect.
