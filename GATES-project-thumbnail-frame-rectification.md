# Gates: Project Thumbnail Frame Rectification

OWNS: components/projects/projects-page-editorial.tsx, components/video-upload-interface.tsx, components/editor/editor-new-project-upload-dialog.tsx, app/editor/[id]/page.tsx, tests/project-thumbnail-frame-rectification.test.ts, GATES-project-thumbnail-frame-rectification.md

Scope: Ensure projects with video assets display their opening frame as the cover on the editorial dashboard with auto-persistence, newly uploaded videos generate instant thumbnails, and media-free drafts display a clean placeholder instead of an empty white surface.

- [x] G1: Editorial project tiles extract opening video frame when thumbnailUrl is missing but sourceAssetId exists, render it as cover, and auto-persist to project.
  CHECK: node --import tsx --test tests/project-thumbnail-frame-rectification.test.ts
  EXPECT: project thumbnail frame rectification tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb8e5ee8ec501419a34b98c98803eca120c528e8a4aa94b8c55c811223ea9142; exit=0; EXPECT=matched; output-sha256=930c13add168db7a92849ae310fe1a4e1c76fc41a5440cf480b5760c5fa23990; output-bytes=486; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Video upload interface extracts opening frame from local file and persists thumbnailUrl during upload flow.
  CHECK: node --import tsx --test tests/project-thumbnail-frame-rectification.test.ts
  EXPECT: project thumbnail frame rectification tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb8e5ee8ec501419a34b98c98803eca120c528e8a4aa94b8c55c811223ea9142; exit=0; EXPECT=matched; output-sha256=07265e98fa2827cab5d6c2f102fa02963365bc218768fded2b0fc5d4b0bc70ff; output-bytes=487; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Draft projects without attached media render an intentional monogram/reel placeholder instead of a stark blank surface.
  CHECK: node --import tsx --test tests/project-thumbnail-frame-rectification.test.ts
  EXPECT: project thumbnail frame rectification tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb8e5ee8ec501419a34b98c98803eca120c528e8a4aa94b8c55c811223ea9142; exit=0; EXPECT=matched; output-sha256=de4be929aa8326ca7964053ef3a3d81a211c16615c6297e87ce7a25d785aec04; output-bytes=484; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
