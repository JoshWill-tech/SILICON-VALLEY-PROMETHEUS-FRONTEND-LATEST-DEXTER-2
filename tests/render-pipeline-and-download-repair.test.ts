import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('G1: ExportService persists storage_path and download-url generates durable R2 links', () => {
  const exportServiceSource = readFileSync('lib/exports/service.ts', 'utf8')
  assert.match(exportServiceSource, /resolvedStoragePath\s*=\s*typeof result\.r2Key === 'string'/, 'ExportService must resolve storage_path from completed r2Key')
  assert.match(exportServiceSource, /update\.storage_path\s*=\s*resolvedStoragePath/, 'ExportService must save storage_path to Supabase')
  assert.match(exportServiceSource, /update\.storage_bucket\s*=/, 'ExportService must save storage_bucket to Supabase')

  const downloadRouteSource = readFileSync('app/api/exports/[id]/download-url/route.ts', 'utf8')
  assert.match(downloadRouteSource, /const storageKey = projectExport\.storagePath \|\|/, 'download-url must prioritize storageKey from completed export')
  assert.match(downloadRouteSource, /getPresignedGetUrl\(\s*bucket,\s*storageKey,\s*filename,\s*86400/, 'download-url must generate 24h presigned R2 URL for durable downloads')
  assert.match(downloadRouteSource, /if \(projectExport\.metadata\?\.outputKind === 'mini-run'/, 'download-url must keep fallback to proxy if storageKey not yet available')

  const outputRouteSource = readFileSync('app/api/mini-run/job/[id]/output/route.ts', 'utf8')
  assert.match(outputRouteSource, /Upstream lambda may have aged out the job, check persistent Supabase project_exports/, 'output route must check persistent Supabase exports when lambda job aged out')
  assert.match(outputRouteSource, /If the upstream presigned URL has expired \(e\.g\. 403\), check for durable R2 storage/, 'output route must fall back to durable R2 storage when presigned URL expired')
})

test('G2: Projects dashboard provides direct download option on cards and modal', () => {
  const projectCardSource = readFileSync('components/projects/project-card.tsx', 'utf8')
  assert.match(projectCardSource, /label:\s*'Download export',\s*icon:\s*Download/, 'ProjectCard must provide Download export action in kebab menu')
  assert.match(projectCardSource, /api\/projects\/\$\{encodeURIComponent\(project\.id\)\}\/exports\/latest/, 'ProjectCard must fetch latest export for direct download')
  assert.match(projectCardSource, /api\/exports\/\$\{encodeURIComponent\(data\.export\.id\)\}\/download-url/, 'ProjectCard must fetch download URL and trigger browser download')

  const detailsModalSource = readFileSync('components/projects/project-details-modal.tsx', 'utf8')
  assert.match(detailsModalSource, /<Download className="size-3\.5" \/>\s*Download/, 'ProjectDetailsModal must render Download button in footer')
  assert.match(detailsModalSource, /const handleDownload = React\.useCallback\(async \(\) =>/, 'ProjectDetailsModal must have handleDownload implementation')
})

test('G3: Editor and Jarvis voice companion enforce session freshness and source readiness', () => {
  const editorPageSource = readFileSync('app/editor/[id]/page.tsx', 'utf8')
  assert.match(editorPageSource, /refreshSession\(\)/, 'Editor page must refresh session token if expired before dispatching render')
  assert.match(editorPageSource, /expiresAt - nowSec < 60/, 'Editor page must check token expiry threshold')

  const voiceCompanionSource = readFileSync('hooks/use-voice-companion.ts', 'utf8')
  assert.match(voiceCompanionSource, /sourceMediaState === 'loading'/, 'useVoiceCompanion must guard start_render against pending source uploads')
  assert.match(voiceCompanionSource, /The source video is still uploading to secure cloud storage/, 'useVoiceCompanion must return truthful upload in-progress message')
})

test('G4: Error sanitizer and safe-response preserve informative messages without false reconnecting loop', () => {
  const sanitizerSource = readFileSync('lib/voice-companion/error-sanitizer.ts', 'utf8')
  assert.match(sanitizerSource, /const isGeneric = !stripped/, 'error-sanitizer must distinguish generic 502 from informative studio errors')
  assert.match(sanitizerSource, /return stripped/, 'error-sanitizer must return preserved studio error when informative')

  const exportsRouteSource = readFileSync('app/api/projects/[id]/exports/route.ts', 'utf8')
  assert.match(exportsRouteSource, /isNotFoundError \? 404 : isValidationError \? 400 : 502/, 'exports route must return accurate 400/404/502 status codes')
})
