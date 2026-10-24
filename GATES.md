# Gates: Rectify Floating Chat Button Overlap with Rendering Status

OWNS: GATES.md, app/editor/[id]/page.tsx, tests/chat-button-rendering-stack.test.ts

Scope: Rectify the layout collision where the floating chat launcher overlaps the export rendering progress dock at the bottom-right of the editor workspace, ensuring the chat button smoothly transitions to sit directly atop the rendering bar with zero overlap and full interaction fidelity.

- [x] G1: FloatingChatComposer accepts isExportRendering and dynamically applies pb-[5.5rem] (88px) to sit cleanly atop the rendering bar (height ~52px at bottom-6) with smooth padding transition.
  CHECK: node --import tsx --test --test-name-pattern="G1" tests/chat-button-rendering-stack.test.ts
  EXPECT: G1 passed: chat composer offsets above rendering bar
  EVIDENCE: automatic-evidence=v1; definition-sha256=ec7257f1640fb517de95c62da996b47dabae2ee46934fb6ccab0616cec684e8a; exit=0; EXPECT=matched; output-sha256=d858d79bf1490cf39d9268d4e0d5395f511f2105c60afde8022d5a4b1f81186d; output-bytes=259; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: ChatWorkspacePanel accepts isExportRendering in its props contract and forwards it to FloatingChatComposer.
  CHECK: node --import tsx --test --test-name-pattern="G2" tests/chat-button-rendering-stack.test.ts
  EXPECT: G2 passed: chat workspace panel forwards isExportRendering
  EVIDENCE: automatic-evidence=v1; definition-sha256=6a0536947dbd8b3de2b6978b462c1a46fd9b50af5fc165b6621cd998440afa97; exit=0; EXPECT=matched; output-sha256=9d1491df83cdeb7077223b994874f7ae966900e6d42002afa100c48ce616626a; output-bytes=273; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: OriginalEditorPage and MobileEditorView integrate isExportRendering with ChatWorkspacePanel and defensively offset the SupoClip Matrix button.
  CHECK: node --import tsx --test --test-name-pattern="G3" tests/chat-button-rendering-stack.test.ts
  EXPECT: G3 passed: editor views integrate export rendering offset
  EVIDENCE: automatic-evidence=v1; definition-sha256=ed36d82c9cd97abc5b9029b52726285c135006289771929526336ffdb7ae2882; exit=0; EXPECT=matched; output-sha256=b14999639ac0da5e87ba26cceca40841e2f74965a615a85d284d9a09c62987fd; output-bytes=288; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Comprehensive regression suite passes validating geometric clearance and zero overlap.
  CHECK: node --import tsx --test tests/chat-button-rendering-stack.test.ts
  EXPECT: all chat rendering stack tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=529c7e30c6774aadbc2701321957aaf5ae6f269062919dfb059162565ef6722d; exit=0; EXPECT=matched; output-sha256=10445dd0efc2730fbcc5f42ee8fa9fe3dd01213b68e48ab5249c6ac9982f4121; output-bytes=814; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: TypeScript typecheck passes with zero errors across the modified files.
  CHECK: node scripts/verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=b1f4bb997a1386556f4e4d5acc883d881fd44a425b32e4d71925cb4bab048fd0; exit=0; EXPECT=matched; output-sha256=88603ae6d0804b467cf0223e64644258397c61d0119a5876e07565cc5b2dd279; output-bytes=17; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
