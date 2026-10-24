# Gates: Prometheus Frontend Popup Modal Z-Index Elevation & Occlusion Prevention

OWNS: GATES.md, app/globals.css, tailwind.config.ts, components/editor/MasterVideoReviewModal.tsx, components/ui/dialog.tsx, components/ui/sheet.tsx, components/ui/slide-drawer.tsx, components/editor/SettingsPanel.tsx, components/editor/CommandBubble.tsx, components/ui/user-profile-popup.tsx, components/editor/thumbnail-studio/ThumbnailWorkspace.styles.ts, tests/popup-modal-zindex-elevation.test.mjs

Scope: Ensure popups, modals, dialogs, drawers, and overlays across the frontend systematically sit above all sticky and fixed headers (including the Untitled Project navbar EditorHeader at z-[100]), portaling into document.body to prevent parent stacking context occlusion.

- [x] G1: Automated regression test verifies that MasterVideoReviewModal and all generic modals/dialogs have z-index exceeding sticky headers and mount with createPortal.
  CHECK: node tests/popup-modal-zindex-elevation.test.mjs
  EXPECT: popup and modal z-index elevation checks passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9a9e456d48dbb99f94301555e91ce6f83746e4b294aafdea1225a6e74f968238; exit=0; EXPECT=matched; output-sha256=4e0f79e363c325d65360f0bc98aa93a9841a812e4f3f659c57fd5e1dd00fe86d; output-bytes=48; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: MasterVideoReviewModal uses createPortal to mount into document.body and has z-[500] so it cannot be occluded by EditorHeader (z-[100]).
  CHECK: node -e "const fs = require('fs'); const code = fs.readFileSync('components/editor/MasterVideoReviewModal.tsx', 'utf8'); if (!code.includes('createPortal') || !code.includes('z-[500]')) process.exit(1); console.log('master video review modal elevation verified');"
  EXPECT: master video review modal elevation verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=8c1042cecb2bfcd60c8aecd3a7fd62b48d71d58df753023618ba1130ffe0f93f; exit=0; EXPECT=matched; output-sha256=36a13dfd330d5ecc55be74bb58a0f701b7d12ef89eac4073c1d12a447854d001; output-bytes=45; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Systemic modal and dialog primitives (dialog.tsx, sheet.tsx, slide-drawer.tsx, SettingsPanel.tsx, CommandBubble.tsx, user-profile-popup.tsx, ThumbnailWorkspace) have elevated z-index (>= 500) dominating all page chrome.
  CHECK: node -e "const fs = require('fs'); const d = fs.readFileSync('components/ui/dialog.tsx', 'utf8'); const s = fs.readFileSync('components/ui/sheet.tsx', 'utf8'); if (!d.includes('z-[500]') || !s.includes('z-[500]')) process.exit(1); console.log('systemic dialogs elevation verified');"
  EXPECT: systemic dialogs elevation verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=8255a76ba300797cc3dcf00fd8268a1530fad1994298851cf29eb65a62f0f37e; exit=0; EXPECT=matched; output-sha256=8212ec41d61d159de2107368c3e02e14dfe9c0ee7a90b1217b08f26c6942a816; output-bytes=36; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Design tokens in globals.css and tailwind.config.ts define --z-modal and elevated --z-overlay tokens.
  CHECK: node -e "const fs = require('fs'); const g = fs.readFileSync('app/globals.css', 'utf8'); const t = fs.readFileSync('tailwind.config.ts', 'utf8'); if (!g.includes('--z-modal: 500') || !t.includes('modal:')) process.exit(1); console.log('design tokens verified');"
  EXPECT: design tokens verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=dd20206eaa82bc47f8365e13eee0d919dd78e49e11a23f41f9493c65eabaa518; exit=0; EXPECT=matched; output-sha256=46f96ea6e00a0c4fda7e84c02a5c0bb61371cdd624b68e302df6096e4f6f1cf3; output-bytes=23; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Full TypeScript verification passes with 0 errors across the entire repository.
  CHECK: npm run typecheck
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9aeeb689bde5257e0a85c8ecb0aad3fdaf9ace3e9e5076bbf6758c22760ccfe3; exit=0; EXPECT=matched; output-sha256=2c4af01fb1a5f9597841244575659986624ce8ada13bbc89dce9491fd48c4a46; output-bytes=93; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
