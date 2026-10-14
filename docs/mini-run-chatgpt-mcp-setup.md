# Prometheus Mini-Run MCP setup

The frontend exposes a remote MCP server at `/api/mcp`. It uses Supabase user access tokens, and its tools operate on the signed-in user's Prometheus records. The endpoint can only be connected to ChatGPT after the app is deployed publicly and the external settings below are configured.

## Supabase OAuth setup

1. In the Supabase project, enable **Authentication > OAuth Server**.
2. Set the authorization path to `/oauth/consent` and set the correct production site URL. The consent page and decision handler are implemented in this frontend.
3. Enable dynamic client registration if ChatGPT should register itself during connection. Otherwise, register the ChatGPT client and its exact callback URI in Supabase.
4. Use asymmetric JWT signing keys for OAuth/OIDC. Supabase requires asymmetric signing for `openid` ID tokens.
5. Verify the Supabase OAuth discovery endpoint advertises the refresh-token scope ChatGPT expects and that refresh tokens are issued. Without refresh support, users may need to reconnect after access tokens expire.

## ChatGPT setup

1. Deploy this frontend on a public HTTPS origin.
2. In ChatGPT, enable developer mode/custom MCP apps where available and add the server URL `https://<frontend-origin>/api/mcp` using OAuth.
3. Complete the OAuth consent as a Prometheus user, scan the three tools, and test listing videos, creating a render, and polling the returned job.
4. Review/publish the custom app according to the ChatGPT workspace plan and access controls. Full MCP write actions are currently available on Business and Enterprise/Edu; Pro supports read/fetch only.

## AWS Mini-Run setup

Set `MINI_RUN_AWS_API_URL` in each frontend environment to the HTTPS AWS Mini-Run gateway origin. The local `.env` and `.env.local` currently point to the deployed AWS Lambda Function URL in `us-east-1`; set the same variable in the production frontend environment.

As of 2026-10-13, the AWS gateway health route returned HTTP 200 with `deployment: aws-lambda`, the backend rejected an unauthenticated job lookup with HTTP 401, and the local frontend proxy successfully called health and chunk routes. The local Next app also started and returned the AWS health response through `/api/mini-run/health`. The deployed production frontend currently returns HTTP 503 from that same route with `MINI_RUN_BACKEND_URL is not configured`; the local worktree is configured, but the production environment/build still needs updating before a production user can render.

These checks do not prove that a real authenticated video has completed rendering and returned a playable MP4. They also do not prove a live ChatGPT OAuth connection or that Redis is configured in the deployed runtime. Complete those checks with a signed-in test account and video, and verify the OAuth setup below before describing the full workflow as live.

Source videos remain in the configured Prometheus object storage. The frontend sends the worker a time-limited presigned URL; it does not upload the source directly to an EC2 instance. The completed MP4 is delivered through `/api/mini-run/job/<jobId>/output`.

## Runtime configuration still required

- A real HTTPS AWS API URL in the frontend deployment.
- Supabase OAuth Server enabled, authorization path/site URL set, and client registration or dynamic registration configured.
- A deployed HTTPS frontend origin and ChatGPT custom app setup.
- End-to-end confirmation that the deployed AWS Mini-Run service accepts the signed-in user's Supabase token, completes a render, and returns a playable MP4 through the frontend.
- Confirmation of the deployed job queue configuration and persistence behavior.
