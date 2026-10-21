import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('G1: Editorial ProjectTile provides fallback video frame capture and auto-persistence', () => {
  const editorialSource = readFileSync('components/projects/projects-page-editorial.tsx', 'utf8')

  assert.match(
    editorialSource,
    /import\s*\{\s*captureFirstVideoFrame\s*\}\s*from\s*['"]@\/lib\/media\/capture-first-video-frame['"]/,
    'projects-page-editorial.tsx must import captureFirstVideoFrame'
  )
  assert.match(
    editorialSource,
    /const\s*\[\s*fallbackFrame\s*,\s*setFallbackFrame\s*\]\s*=\s*React\.useState/,
    'ProjectTile must maintain fallbackFrame state'
  )
  assert.match(
    editorialSource,
    /fetch\(`\/api\/projects\/\$\{encodeURIComponent\(project\.id\)\}\/assets`/,
    'ProjectTile must fetch project source asset when thumbnailUrl is missing'
  )
  assert.match(
    editorialSource,
    /captureFirstVideoFrame\(payload\.source\.url\)/,
    'ProjectTile must capture the opening frame from the video source URL'
  )
  assert.match(
    editorialSource,
    /method:\s*['"]PATCH['"][\s\S]*?thumbnailUrl:\s*frame/,
    'ProjectTile must auto-persist the captured frame to the project record'
  )
  assert.match(
    editorialSource,
    /const effectiveThumbnail\s*=\s*\(!thumbnailFailed\s*&&\s*project\.thumbnailUrl\)\s*\?\s*project\.thumbnailUrl\s*:\s*fallbackFrame/,
    'ProjectTile must use fallbackFrame as effectiveThumbnail when project.thumbnailUrl is not available'
  )
})

test('G2: video-upload-interface captures initial frame from uploaded video files and persists thumbnailUrl', () => {
  const uploadSource = readFileSync('components/video-upload-interface.tsx', 'utf8')

  assert.match(
    uploadSource,
    /import\s*\{\s*captureFirstVideoFrame\s*\}\s*from\s*['"]@\/lib\/media\/capture-first-video-frame['"]/,
    'video-upload-interface.tsx must import captureFirstVideoFrame'
  )
  assert.match(
    uploadSource,
    /selectedSourceFile\.type\.startsWith\(["']video\/["']\)/,
    'video-upload-interface must verify uploaded source file is a video'
  )
  assert.match(
    uploadSource,
    /URL\.createObjectURL\(selectedSourceFile\)/,
    'video-upload-interface must create an object URL for instant local frame capture'
  )
  assert.match(
    uploadSource,
    /captureFirstVideoFrame\(localBlobUrl/,
    'video-upload-interface must capture initial frame from local blob URL'
  )
  assert.match(
    uploadSource,
    /URL\.revokeObjectURL\(localBlobUrl\)/,
    'video-upload-interface must revoke local blob URL to avoid memory leaks'
  )
  assert.match(
    uploadSource,
    /project\.thumbnailUrl\s*=\s*initialFrame/,
    'video-upload-interface must set thumbnailUrl on project'
  )
  assert.match(
    uploadSource,
    /fetch\(`\/api\/projects\/\$\{encodeURIComponent\(project\.id\)\}`[\s\S]*?thumbnailUrl:\s*initialFrame/,
    'video-upload-interface must persist the initial frame to the database'
  )
})

test('G3: Editorial ProjectTile renders graceful placeholder for draft projects without media', () => {
  const editorialSource = readFileSync('components/projects/projects-page-editorial.tsx', 'utf8')

  assert.match(
    editorialSource,
    /Film/,
    'projects-page-editorial.tsx must import Film icon for empty draft placeholder'
  )
  assert.match(
    editorialSource,
    /Draft piece/,
    'ProjectTile must render a stylized "Draft piece" indicator when no media/thumbnail is attached'
  )
})

console.log('project thumbnail frame rectification tests passed')
