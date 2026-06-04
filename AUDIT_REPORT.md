# PROMETHEUS CODEBASE AUDIT REPORT
## Generated: 2026-06-04
## Agent: Gemini CLI
## Classification: CONFIDENTIAL

---

## 1. EXECUTIVE SUMMARY

### 1.1 Stack Overview
| Component | Technology | Version | Status |
|-----------|-----------|---------|--------|
| Frontend | Next.js (App Router) | 16.2.4 | OK |
| Backend | Next.js API Routes | 16.2.4 | OK |
| Database | PostgreSQL (Supabase) | | OK |
| Auth | Supabase Auth | 2.104.1 | OK |
| OAuth (Authorization) | Supabase Auth (Login only) | | OK |
| State Management | React Context / useReducer | | OK |
| Styling | Tailwind CSS (v4) / OKLCH | 4.1.9 | OK |
| Video Processing | Remotion | 4.0.446 | OK |
| Timeline Renderer | HTML Canvas 2D | | OK |
| Payments | Paddle | 3.8.0 | OK |

### 1.2 Critical Findings (P0)
- **NONE FOUND.** No raw passwords, raw OAuth tokens, or raw credit card data found in source code or migrations.

### 1.3 High Findings (P1)
- **CORS Wildcard in RAG Route:** `app/api/rag/route.ts` defaults to `Access-Control-Allow-Origin: *`. While likely intended for a public API, it should be restricted to known origins in production.
- **Mocked Social Posting:** All files in `lib/social/` (tiktok.ts, instagram.ts, etc.) are currently mocks. Social posting functionality is NOT implemented.
- **Mocked Social Accounts UI:** `app/settings/social-accounts/page.tsx` uses static data and mocks for "Tokens encrypted at rest" claims.

### 1.4 Medium Findings (P2)
- **Insecure Default API URL:** `next.config.mjs` defaults `backendApiBaseUrl` to `http://localhost:8000`. Normal for dev, but requires environment variable configuration for production.
- **Mixing Environment Variables:** Both `VITE_API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` are used in `next.config.mjs`, which is slightly confusing given it's a Next.js project.

### 1.5 Shabby / Anachronistic Code
- **Circular Reference:** `projects` table has a nullable `source_asset_id` referring to `source_assets`, which itself refers back to `projects`.
- **Empty configurations:** `tailwind.config.ts` is almost empty as it relies on Tailwind 4's CSS-based configuration.

---

## 2. PROJECT STRUCTURE

```
.
├── BellavoirSerif_PERSONAL_USE_ONLY.otf
├── app
│   ├── (auth)
│   ├── api
│   ├── editor
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── auth
│   ├── billing
│   ├── editor
│   ├── ui
│   └── video-upload-interface.tsx
├── lib
│   ├── auth
│   ├── billing
│   ├── cinematic
│   └── supabase
├── supabase
│   ├── config.toml
│   └── migrations
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

### 2.1 File Architecture Assessment
- **Feature-based Routing:** Routes are well-organized in `app/`.
- **Atomic UI Components:** Located in `components/ui/` (likely shadcn/ui base).
- **Domain Logic:** Spread across `lib/` and `app/api/`.

---

## 3. FRONTEND ARCHITECTURE

### 3.1 Router Type
- **App Router:** Primary (and only) router.

### 3.2 Key Files
| File | Path | Purpose | Status |
|------|------|---------|--------|
| Editor Page | `app/editor/page.tsx` | Main editor entry | OK |
| Settings Page | `app/settings/page.tsx` | General settings | OK |
| Export Drawer | `components/editor/ExportDrawer.tsx` | Export UI | OK |
| Timeline Engine | `components/editor/TimelineEngine.tsx` | Canvas-based timeline | OK |

### 3.3 State & Styling
- **State Management:** React Context (`components/editor/EditorContext.tsx`).
- **Styling:** Tailwind CSS 4 with OKLCH variables in `app/globals.css`.
- **Animations:** Framer Motion and GSAP.

---

## 4. BACKEND ARCHITECTURE

### 4.1 Backend Type
- **Next.js API Routes:** Integrated backend handling all logic.

### 4.2 API Routes
| Method | Route | Handler File | Purpose |
|--------|-------|-------------|---------|
| POST | `/api/auth/signup` | `app/api/auth/signup/route.ts` | User registration |
| POST | `/api/auth/login` | `app/api/auth/login/route.ts` | User login |
| POST | `/api/upload/multipart/...` | `app/api/upload/multipart/...` | S3 Multipart Upload |
| POST | `/api/jobs/create` | `app/api/jobs/create/route.ts` | Trigger background jobs |
| POST | `/api/rag` | `app/api/rag/route.ts` | Knowledge retrieval |

### 4.3 Communication
- **Fetch API:** Standard client-side calls to `/api/...`.
- **Base URL:** Defined as `/api/` or `process.env.NEXT_PUBLIC_API_BASE_URL`.

### 4.4 CORS
- **Configuration:** Custom headers in `app/api/rag/route.ts`.
- **Wildcard Issue:** `*` origin allowed in RAG route (P1).

---

## 5. OAUTH & AUTHENTICATION

### 5.1 Existing Auth (Login)
- **Supabase Auth:** Used for email/password and social login.

### 5.2 Existing OAuth (Authorization — Social Posting)
| Provider | Implemented? | File Path | Scopes | Callback URL | Status |
|----------|--------------|-----------|--------|--------------|--------|
| Google | Yes (Login) | `components/auth/SocialAuthButtons.tsx` | profile, email | `/auth/confirm` | Working |
| Apple | Yes (Login) | `components/auth/SocialAuthButtons.tsx` | | `/auth/confirm` | Working |
| GitHub | Yes (Login) | `components/auth/SocialAuthButtons.tsx` | | `/auth/confirm` | Working |
| YouTube | No | `lib/social/youtube.ts` | | | Mock |
| TikTok | No | `lib/social/tiktok.ts` | | | Mock |
| Instagram | No | `lib/social/instagram.ts` | | | Mock |

### 5.3 Token Storage
- **Auth Tokens:** Managed by Supabase (HTTP-only cookies / local storage).
- **Social Posting Tokens:** **NOT IMPLEMENTED.**

### 5.4 Supabase Auth Details
- **Client Locations:** `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- **Service Role Key:** Used in `app/api/music/enrich/route.ts` and `app/api/billing/webhook/route.ts`.

---

## 6. DATABASE

### 6.1 Schema
- **Postgres:** Defined in `supabase/migrations`.
- **ORM:** None explicitly visible besides Supabase client.

### 6.2 Critical Tables
| Table | Purpose | Has Encryption? | P0 Issue? |
|-------|---------|-----------------|-----------|
| `projects` | User workspaces | No | No |
| `source_assets` | Uploaded media metadata | No | No |
| `subscriptions` | Paddle billing state | No | No |

### 6.3 Credit Card Data
- **No.** Raw card data is not stored. Paddle handles PCI compliance.

---

## 7. VIDEO & TIMELINE

### 7.1 Video Pipeline
- **Upload:** R2 multipart upload via `/api/upload`.
- **Processing:** Remotion used for rendering and playback.

### 7.2 Timeline Components
| Component | File Path | Renderer | Status |
|-------------|-----------|----------|--------|
| `TimelineEngine` | `components/editor/TimelineEngine.tsx` | Canvas 2D | OK |

### 7.3 Thumbnails
- **Airtable integration:** Appears to fetch style previews and images from Airtable.

---

## 8. ENVIRONMENT & SECURITY

### 8.1 Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase Key.
- `PADDLE_API_KEY`: Paddle Secret.
- `R2_ACCESS_KEY_ID`: Cloudflare R2 Credentials.
- `GROQ_API_KEY`: AI Model API Key.

### 8.2 Security Findings
| Check | Result | Severity | File Path |
|-------|--------|----------|-----------|
| Tokens in localStorage | No (UI State only) | P3 | |
| Hardcoded secrets | No | - | |
| Raw SQL injection risk | No | - | |
| CORS wildcard | Yes | P1 | `app/api/rag/route.ts` |
| HTTP in production | No (Local dev only) | P2 | `next.config.mjs` |

---

## 9. DEPLOYMENT

- **Vercel:** Primary deployment target (`vercel.json` present).
- **Cloudflare R2:** Used for media storage.

---

## 10. GAPS & RECOMMENDATIONS

### 10.1 Missing Implementations
- **Social Posting:** Actual OAuth flow for TikTok, YouTube, Instagram needs to be built.
- **Background Workers:** Remotion rendering usually requires heavy compute (Lambda/Compute Engine).

### 10.2 Shabby Code Requiring Refactor
- **Mock Cleanup:** Remove/replace mocks in `lib/social/` and `app/settings/social-accounts/`.

---

## 11. ANSWERS TO ARCHITECT QUESTIONS

### Q1: Exact Stack
- Frontend: Next.js 16.2.4 (App Router)
- Backend: Next.js API Routes (Node.js)
- Communication: REST (Fetch)

### Q2: OAuth Library
- Library: Supabase Auth
- Working for login? Yes
- Working for social posting? No

### Q3: Supabase Location
- Frontend: `lib/supabase/client.ts`
- Backend: `lib/supabase/server.ts`
- Service role key used? Yes, in specific API routes.

### Q4: Callback URLs
- Google/Apple/GitHub: `/auth/confirm` on the frontend.

---

*Report generated by Prometheus Audit Agent*
*Classification: INTERNAL USE ONLY*
