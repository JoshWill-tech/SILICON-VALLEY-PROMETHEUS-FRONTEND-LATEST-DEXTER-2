# Gates: remove-pronouns-from-frontend

OWNS: app/settings/profile/page.tsx, app/settings/page.tsx, scripts/verify-pronouns-removed.mjs, scripts/verify-settings-lint.mjs, GATES.md

Scope: Remove the Pronouns field from the profile settings form and overview page in the frontend while preserving location and existing settings functionality.

- [ ] G1: Pronouns section is removed from profile form and settings overview while location is preserved.
  CHECK: node scripts/verify-pronouns-removed.mjs
  EXPECT: all pronouns removal assertions passed
  EVIDENCE: pending

- [ ] G2: Existing profile test suite passes without regression.
  CHECK: node --test tests/uiux-v3-corrections.test.mjs
  EXPECT: pass 7
  EVIDENCE: pending

- [ ] G3: Lint passes cleanly on modified frontend settings files.
  CHECK: node scripts/verify-settings-lint.mjs
  EXPECT: settings lint passed
  EVIDENCE: pending
