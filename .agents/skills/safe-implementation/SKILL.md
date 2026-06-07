# Safe Implementation — Additive Changes Only

> **Scope:** Implement new features, effects, and enhancements WITHOUT destroying existing functionality.
> **Constraint:** This is a **HARD CONSTRAINT**. You may only ADD code. You may NOT delete, replace, or rewrite existing files unless explicitly authorized.
> **Philosophy:** Every existing line of code is there for a reason. You do not know which lines are "decorative" vs "functional" until you read the full file and understand the context.

---

## MANDATORY PRE-FLIGHT CHECKLIST

**Before you write a single line of code, you MUST complete ALL of these steps. No exceptions.**

### Step 1: Scope Assessment
- [ ] Read the user's request carefully. Identify exactly which files need to be touched.
- [ ] If the request mentions a new feature, identify where it should live (new file vs existing file).
- [ ] If the request modifies an existing feature, identify the exact files involved.

### Step 2: Git Diff Review
- [ ] Run `git diff --stat` to see what has already been changed in the current branch.
- [ ] Report the top 10 files by line-change count.
- [ ] If any file shows >100 lines changed, read that file FULLY before touching it.
- [ ] If you see unexpected deletions, STOP and ask for clarification.

### Step 3: File Content Review
- [ ] For every existing file you plan to modify, read the FULL file content first.
- [ ] Do NOT rely on snippets, summaries, or your memory of the file.
- [ ] Identify the imports, exports, state management, and side effects.
- [ ] Identify which parts are functional (business logic, API calls, auth) vs decorative (animations, styling).

### Step 4: API Contract Verification
- [ ] If you plan to change how a hook is called (e.g., `useAuth()`), read the hook's DEFINITION first.
- [ ] If you plan to change an API endpoint path, verify the backend route exists.
- [ ] If you plan to change a prop interface, check ALL consumers of that component.
- [ ] **Rule:** If you don't know the contract, you don't change the call site.

### Step 5: Dependency Check
- [ ] If you import a new library/component, verify it exists in `package.json`.
- [ ] If it doesn't exist, add it via `npm install <package>` BEFORE using it.
- [ ] If you use a new CSS custom property, verify it's defined in the global CSS or Tailwind config.
- [ ] If you use a new Tailwind utility class, verify it's configured in `tailwind.config.ts`.

### Step 6: Build & Lint Baseline
- [ ] Run `npm run build` and record the result. If it fails now, STOP. The baseline is broken.
- [ ] Run `npm run lint` and record the result.
- [ ] Only proceed if the baseline is green (or you understand the pre-existing failures).

---

## HARD RULES — VIOLATIONS ARE NOT ALLOWED

### Rule 1: No Deletions >20% of a File
- You may NOT delete more than 20% of any existing file's lines.
- If a feature needs to be "replaced," you must ADD the new implementation and COMMENT OUT the old one (with a reason comment).
- The commented-out code must be preserved so the user can review and decide to delete later.
- **Exception:** Only if the prompt explicitly says "Delete X and replace with Y" for a specific file.

### Rule 2: No Rewriting Entire Files
- You may NOT rewrite a file from scratch unless the file is <50 lines AND the rewrite is explicitly requested.
- If a file is large (>200 lines), you must make surgical edits (add functions, modify specific lines) rather than rewriting.
- **Exception:** If the file is completely broken and the user explicitly says "rebuild this file," you may rewrite it.

### Rule 3: No Silent API Changes
- You may NOT change the return value of a hook, the props of a component, or the signature of a function without:
  1. Reading ALL consumers first
  2. Updating ALL consumers in the same edit session
  3. Documenting the change in a comment at the definition site
- **Example:** If `useAuth()` returns `{ user }`, you may NOT change it to `{ session }` without updating every file that uses it.

### Rule 4: No Endpoint Path Changes Without Backend Verification
- You may NOT change a frontend API path (e.g., `/api/oauth/google/initiate` → `/api/auth/connect/google`) without:
  1. Reading the backend route files to see which path is actually served
  2. Updating the backend if needed, OR keeping the frontend path as-is
- The frontend and backend must match. Period.

### Rule 5: No Hardcoded Demo Data in Production Paths
- You may NOT hardcode names like `"Dexter"`, `"Test User"`, or fake emails in production-facing components.
- All user-facing strings must come from:
  - Auth context (`useAuth()`, `UserContext`)
  - Supabase session/user metadata
  - API responses
  - Environment variables (for brand names)
- Fallbacks must be generic (e.g., `"there"`, `"User"`), not specific demo names.

### Rule 6: No Brand Color Changes Without Approval
- You may NOT change brand colors (e.g., cyan from `#00f0ff` to `#22d3ee`) unless the user explicitly requests it.
- If you need a new color for a new component, use a NEW token name (e.g., `accent-cyan-soft`) rather than overwriting the existing one.

### Rule 7: No New Dependencies Without Installation
- If you write code that imports a package not currently in `package.json`, you MUST run `npm install <package>`.
- You may NOT leave the import dangling and hope the user installs it later.
- Prefer existing dependencies. If the project already has `framer-motion`, use it. Don't add `gsap` for a simple animation.

### Rule 8: No JS Breakpoints for Responsive Layout
- You may NOT use `window.innerWidth` checks to decide between mobile/desktop layouts at 1024px or 768px.
- Use Tailwind responsive prefixes: `hidden md:block`, `md:hidden`, `lg:flex`, etc.
- JS width checks are only allowed for feature detection (e.g., disabling WebGL on small screens), not for layout switching.

### Rule 9: No Unmounting Overlays That Block Interaction
- If you add an overlay (voice mode, modal, drawer), it must NOT block the underlying interactive elements unless that is the intended behavior.
- Use `pointer-events: none` on decorative overlays.
- Ensure the overlay has a clear close/stop mechanism that is itself clickable.

### Rule 10: No Build Errors — Clean First Pass
- After you finish, `npm run build` must pass on the FIRST attempt.
- If it fails, you failed this prompt. Fix the errors and rebuild.
- Do not claim "success after retries." The goal is a clean build.

---

## ADDITIVE CHANGE PATTERNS

When asked to add a feature, use these patterns:

### Pattern A: New Feature → New File
- Create a new component/hook file.
- Import it into the existing page/component where it belongs.
- Do NOT modify the existing file's core logic beyond the import and JSX insertion.

### Pattern B: New Feature → Existing File
- Add the new function/component at the BOTTOM of the file.
- Add the new import at the TOP of the file.
- Add the JSX usage in the specific place needed.
- Do NOT touch unrelated code.

### Pattern C: Enhancement → Existing Component
- Wrap the existing component in a new parent if needed (e.g., add `ParallaxCard` around `ChatInput`).
- Pass new props as OPTIONAL with defaults.
- Ensure the component works exactly as before when the new props are not provided.

### Pattern D: Styling Update
- Add new CSS classes. Do NOT remove existing classes unless they are literally unused.
- Use `cn()` (clsx + tailwind-merge) to conditionally add classes.
- If replacing a color, add a new CSS custom property rather than overwriting the old one.

---

## POST-FLIGHT CHECKLIST

**After you finish coding, you MUST complete ALL of these steps before reporting success.**

### Step 1: Build Verification
- [ ] Run `npm run build`
- [ ] It passes on the FIRST attempt. No retries, no "fixed after 3 tries."
- [ ] If it fails, fix the errors and run again. Report the final error count.

### Step 2: Lint Verification
- [ ] Run `npm run lint`
- [ ] Zero new lint errors introduced.
- [ ] Pre-existing lint errors are acceptable but should be noted.

### Step 3: Diff Review
- [ ] Run `git diff --stat`
- [ ] Report the total number of files changed and lines added/removed.
- [ ] If any file shows >50% of its lines changed, explain WHY.
- [ ] If any file was deleted, explain WHY and confirm it was authorized.

### Step 4: API Contract Verification
- [ ] Verify all hooks still return what they returned before.
- [ ] Verify all API paths still match the backend routes.
- [ ] Verify all component props interfaces are still valid for all consumers.

### Step 5: Dependency Verification
- [ ] Run `npm list --depth=0` (or check `package.json`) to confirm all new imports are installed.
- [ ] If a dependency was added, it appears in `package.json`.

### Step 6: Manual Logic Verification
- [ ] Read every file you modified one more time.
- [ ] Ask yourself: "Did I delete anything that might have been functional?"
- [ ] Ask yourself: "Did I change any API that other files depend on?"
- [ ] Ask yourself: "Is there any hardcoded demo data that users will see?"

---

## FINAL REMINDER

> **You are not a code generator. You are a code surgeon.**
  >  
> Your job is to add value without destroying value. Every line of existing code represents a decision, a bug fix, a feature, or a workaround. You do not have the context to know which is which. Therefore, you preserve everything and add alongside it.
> 
> If a file is messy, you do not clean it up unless asked. If a function is long, you do not refactor it unless asked. If a color is ugly, you do not change it unless asked.
> 
> **Add. Do not delete. Enhance. Do not replace.**
