# Gates: Project Thumbnail Frame Rectification

OWNS: components/projects/projects-page-editorial.tsx, components/video-upload-interface.tsx, tests/project-thumbnail-frame-rectification.test.ts, GATES-project-thumbnail-frame-rectification.md

Scope: Ensure projects with video assets display their opening frame as the cover on the editorial dashboard with auto-persistence, newly uploaded videos generate instant thumbnails, and media-free drafts display a clean placeholder instead of an empty white surface.

- [x] G1: Editorial project tiles extract opening video frame when thumbnailUrl is missing but sourceAssetId exists, render it as cover, and auto-persist to project.
  CHECK: node --import tsx --test tests/project-thumbnail-frame-rectification.test.ts
  EXPECT: project thumbnail frame rectification tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb8e5ee8ec501419a34b98c98803eca120c528e8a4aa94b8c55c811223ea9142; exit=0; EXPECT=matched; output-sha256=afe0759881f678b967c353ecb67bbbbdb518b8381b192f4ba202ecd5a3cd6877; output-bytes=487; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Video upload interface extracts opening frame from local file and persists thumbnailUrl during upload flow.
  CHECK: node --import tsx --test tests/project-thumbnail-frame-rectification.test.ts
  EXPECT: project thumbnail frame rectification tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb8e5ee8ec501419a34b98c98803eca120c528e8a4aa94b8c55c811223ea9142; exit=0; EXPECT=matched; output-sha256=f6db484ea6957cc9b1c10e870bdc09a00eb65aac5bd5f96b22e2f87fe72d56e4; output-bytes=487; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Draft projects without attached media render an intentional monogram/reel placeholder instead of a stark blank surface.
  CHECK: node --import tsx --test tests/project-thumbnail-frame-rectification.test.ts
  EXPECT: project thumbnail frame rectification tests passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=cb8e5ee8ec501419a34b98c98803eca120c528e8a4aa94b8c55c811223ea9142; exit=0; EXPECT=matched; output-sha256=3b0f1d18a01007f0ddb6663e5223de6336b6d745bb2a2f603da9b80bc5bf7441; output-bytes=486; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
