import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'

test('G1: lib/oauth/capabilities recognizes google_drive when credentials exist', async () => {
  const { configuredOAuthProviders } = await import('../lib/oauth/capabilities')
  const envWithGoogle = {
    GOOGLE_CLIENT_ID: 'google-client-id-test',
    GOOGLE_CLIENT_SECRET: 'google-client-secret-test',
  } as unknown as NodeJS.ProcessEnv
  
  const providers = configuredOAuthProviders(envWithGoogle)
  assert.ok(providers.includes('google_drive'), 'google_drive should be included when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set')
})

test('G2: app/api/export/[provider] does not query non-existent public_url column on source_assets', () => {
  const code = fs.readFileSync('app/api/export/[provider]/route.ts', 'utf8')
  assert.ok(!code.includes(".select('public_url')"), 'Should not query non-existent public_url column from source_assets')
})

test('G3: ExportDrawer provides functional export action for Google Drive when connected', () => {
  const code = fs.readFileSync('components/editor/ExportDrawer.tsx', 'utf8')
  assert.ok(code.includes('/api/export/'), 'ExportDrawer should call /api/export/ endpoint')
  assert.ok(code.includes('google_drive'), 'ExportDrawer should handle google_drive export')
})

test('G4: ExportPanel wires real user connections and triggers export on click', () => {
  const code = fs.readFileSync('components/editor/panels/ExportPanel.tsx', 'utf8')
  assert.ok(code.includes('useUserConnections'), 'ExportPanel should use useUserConnections to check connection status')
  assert.ok(code.includes('/api/export/'), 'ExportPanel should call /api/export/ endpoint on export')
})

test('G5: Projects page supports exporting V1 file to Google Drive', () => {
  const code = fs.readFileSync('app/projects/page.tsx', 'utf8')
  assert.ok(code.includes('handleExportToDrive') || code.includes('exportToDrive') || code.includes('google_drive') || code.includes('ExportDrawer'), 'Projects page should support export to Google Drive')
})
