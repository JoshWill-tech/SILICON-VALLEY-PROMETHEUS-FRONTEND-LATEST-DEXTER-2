# Prometheus Vercel Deployment Checklist

Generated: 2026-06-07

## Local Verification

Run these checks before pushing revamp changes:

```bash
npm install
npx tsc --noEmit
npm run lint
npm run build
grep -r "bg-glass-bg" components/ app/ hooks/ || echo "PASS: No illegal utilities"
grep -rn "localStorage" app/ components/ hooks/ | grep -v "useEffect" | grep -v "typeof window" | grep -v "useCallback" || echo "PASS: localStorage only in guarded code"
ls components/editor/EditorShell.tsx components/editor/EditorRouteShell.tsx components/dashboard/DashboardRotator.tsx components/sidebar/AwwwardsSidebar.tsx hooks/useDashboardRotation.ts hooks/useContextualFlags.ts
```

The destructive clean-install form from the handoff (`rm -rf node_modules package-lock.json`) is intentionally not the default here because this repo is operating under additive-only implementation rules.

## Required Vercel Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

| Variable | Environment |
| --- | --- |
| `SUPABASE_URL` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only |
| `NEXT_PUBLIC_APP_URL` | Production, Preview |

The current local build reaches Next page-data collection and then fails without Supabase env vars at `/api/export/[provider]`. That is the deployment blocker to resolve in Vercel.

## Vercel Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: 20.x or current LTS

## Git Push

The local `pushboth` alias already exists and pushes the current branch to both `origin` and `upstream`:

```bash
git pushboth
```

Run checks before pushing:

```bash
npm run typecheck && npm run lint && git pushboth
```

## Post-Deploy Smoke Tests

- `/` loads without a 500.
- `/dashboard` redirects to `/signup` when unauthenticated.
- `/editor` redirects to `/signup` when unauthenticated.
- `/mobile` returns 200.
- `/signup` renders without crash.

## Rollback

```bash
git log --oneline -5
git revert HEAD --no-edit
git pushboth
```

You can also use Vercel Dashboard -> Deployments -> Promote previous deployment.
