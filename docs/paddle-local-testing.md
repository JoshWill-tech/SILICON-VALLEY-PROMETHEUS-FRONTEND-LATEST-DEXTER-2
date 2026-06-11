# Paddle Local Testing

This project uses Paddle Billing with an overlay checkout for subscriptions.

## Requirements

- Node.js and npm
- A Paddle account (sandbox recommended for testing)
- ngrok or a similar tool to receive webhooks locally
- Supabase env vars already working for local auth

## Env vars

Add these to `.env.local`:

```env
PADDLE_API_KEY=...
PADDLE_WEBHOOK_SECRET=...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=...
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_CREATOR_PRICE_ID=pri_...
PADDLE_STUDIO_PRICE_ID=pri_...
PADDLE_CINEMA_PRICE_ID=pri_...
```

Notes:

- `PADDLE_API_KEY` comes from `Paddle Dashboard -> Developer tools -> Authentication`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` comes from `Paddle Dashboard -> Developer tools -> Authentication`
- `PADDLE_WEBHOOK_SECRET` comes from your webhook destination settings
- Price IDs come from `Paddle Dashboard -> Catalog -> Prices`
- `NEXT_PUBLIC_PADDLE_ENVIRONMENT` should be `sandbox` for testing and `production` for live.

## Receiving Webhooks Locally

Paddle requires a public URL for webhooks. Use ngrok to expose your local server:

1. Install ngrok: `brew install ngrok`
2. Start ngrok: `ngrok http 3000`
3. Copy the ngrok URL (e.g., `https://random-id.ngrok-free.app`)
4. Go to `Paddle Dashboard -> Developer tools -> Webhooks`
5. Create a new destination:
   - URL: `https://random-id.ngrok-free.app/api/billing/webhook`
   - Secret: Copy this into `PADDLE_WEBHOOK_SECRET` in `.env.local`
   - Events: Select `transaction.completed`, `subscription.updated`, `subscription.deleted`, etc.

## Start the app

```bash
npm install
npm run dev
```

## Real checkout flow test

1. Sign in locally.
2. Open `/settings/billing`.
3. Click a paid plan.
4. The Paddle overlay should appear.
5. Complete checkout in sandbox mode.
6. Confirm you land on `/settings/billing/success`.

## Recommended Paddle sandbox test cards

Check the Paddle documentation for the latest sandbox test card numbers. Usually, any valid card number format works in sandbox if the expiry is in the future.

## Current limitation

The app currently mirrors successful checkout into local browser billing state for testing. The production-safe next step is persisting subscription state from the webhook into your database and checking billing access from the server.
