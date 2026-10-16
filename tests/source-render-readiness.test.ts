import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { canSubmitSourceRender } from '../lib/editor/render-delivery'

assert.equal(canSubmitSourceRender('staged-source-id', 'uploading'), false)
assert.equal(canSubmitSourceRender('staged-source-id', 'failed'), false)
assert.equal(canSubmitSourceRender(null, 'ready'), false)
assert.equal(canSubmitSourceRender('committed-source-id', 'ready'), true)

const deliveryStudio = readFileSync(new URL('../components/editor/editorial-delivery-studio.tsx', import.meta.url), 'utf8')
const editorPage = readFileSync(new URL('../app/editor/[id]/page.tsx', import.meta.url), 'utf8')
assert.match(deliveryStudio, /if \(!canSubmitSourceRender\(sourceAssetId, sourceUploadStatus\) \|\| isSubmitting \|\| pendingRecord\) return/)
assert.match(deliveryStudio, /disabled=\{!canSubmitSourceRender\(sourceAssetId, sourceUploadStatus\)/)
assert.match(editorPage, /if \(!canSubmitSourceRender\(sourceAssetId, sourceUploadStatus\)\)/)
assert.match(editorPage, /setIsSourceUploadFailed\(true\)/)
assert.equal((editorPage.match(/sourceUploadStatus=\{sourceUploadStatus\}/g) ?? []).length, 4)

console.log('source render readiness assertions passed')
