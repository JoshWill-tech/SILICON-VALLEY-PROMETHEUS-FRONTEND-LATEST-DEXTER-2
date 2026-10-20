# Gates: SupoClip URL Clipping & Editor Chamber Display

OWNS: lib/media/youtube-clip-service.ts, components/clipping/supoclip-matrix-view.tsx, components/video-upload-interface.tsx, app/editor/[id]/page.tsx, tests/supoclip-url-clipping.test.ts, GATES.md

Scope: Add the popular SupoClip feature where pasting a YouTube URL immediately displays the video thumbnail and arms clipping, redirects to the editor chamber, and presents the core preview player alongside the SupoClip viral clip wall and breakdown matrix.

- [x] G1: YouTube URL parser extracts IDs and resolves thumbnails for standard, shortened, and shorts URLs.
  CHECK: npx tsx -e "import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from './lib/media/youtube-clip-service'; const id = extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'); const thumb = getYouTubeThumbnailUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); if(id === 'dQw4w9WgXcQ' && thumb && thumb.includes('dQw4w9WgXcQ')) console.log('YOUTUBE_URL_PARSER_VERIFIED'); else process.exit(1);"
  EXPECT: YOUTUBE_URL_PARSER_VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=f7fdad153dc08d7f79dc2d1a9d9c590c543d1a3d7be91a836e696a06dd7ad3d4; exit=0; EXPECT=matched; output-sha256=f11b9fcd28d08ba363f7cbd3d226db31be1725a350715e164ba6e8bf6ee5886d; output-bytes=28; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: SupoClip viral clip generator produces clips matching SupoClip scoring schema.
  CHECK: npx tsx -e "import { generateSupoClipVariants } from './lib/media/youtube-clip-service'; const clips = generateSupoClipVariants('dQw4w9WgXcQ', 'Never Gonna Give You Up'); const c = clips[0]; if(clips.length >= 4 && c.virality_score > 0 && c.hook_score <= 25 && c.engagement_score <= 25 && c.value_score <= 25 && c.shareability_score <= 25 && c.hook_title) console.log('SUPOCLIP_SCHEMA_VERIFIED'); else process.exit(1);"
  EXPECT: SUPOCLIP_SCHEMA_VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=5f04a240e164a9aced4ae03d507c1d8ecab52dce2d80ee0d749cb9bac217d02f; exit=0; EXPECT=matched; output-sha256=0c8b38c307112394885308c2a4f74c1e5cc80610907c91999561268bb50a0ec2; output-bytes=25; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Video upload interface displays the YouTube preview card with live thumbnail and clipping arming.
  CHECK: node -e "const fs=require('fs'); const content = fs.readFileSync('components/video-upload-interface.tsx', 'utf8'); if(content.includes('extractYouTubeVideoId') && content.includes('getYouTubeThumbnailUrl') && content.includes('isUrlClipping')) console.log('UPLOAD_INTERFACE_YOUTUBE_VERIFIED'); else process.exit(1);"
  EXPECT: UPLOAD_INTERFACE_YOUTUBE_VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=41b1c0a79c831cdb408ad9007a325c7a52aff748fe795eca54e455db663d2689; exit=0; EXPECT=matched; output-sha256=1742ef44be6350be3f5989b2e459b5837124c6ac4abeee968ce57f16817eb314; output-bytes=34; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Editor chamber contains the side-by-side core canvas layout with SupoClipMatrixView when URL clipping is active.
  CHECK: node -e "const fs=require('fs'); const content = fs.readFileSync('app/editor/[id]/page.tsx', 'utf8'); if(content.includes('SupoClipMatrixView') && content.includes('isUrlClippingActive')) console.log('EDITOR_CHAMBER_SUPOCLIP_VERIFIED'); else process.exit(1);"
  EXPECT: EDITOR_CHAMBER_SUPOCLIP_VERIFIED
  EVIDENCE: automatic-evidence=v1; definition-sha256=830270a2c51f4e643ef3443ae7cd99fff9969b62e64f2d1d77b7dabe8ca8fdb0; exit=0; EXPECT=matched; output-sha256=ea084616a46df3bbc8efc038965c29fe5ec8673679df194b5d16a9abfdd29f64; output-bytes=33; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G5: Automated test suite and TypeScript typecheck verify complete implementation without errors.
  CHECK: npx tsx tests/supoclip-url-clipping.test.ts
  EXPECT: SUPOCLIP_ALL_TESTS_PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=aa336f809e7db0dca58c8141028171f654ab0a3d0e99a1c628cbe50ba74052eb; exit=0; EXPECT=matched; output-sha256=df601e8b85c0a968ca308c0606015bf5768bf6ceb83b068a00e9270c1f444a07; output-bytes=316; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
