import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

test('the actual Mini-Run client API bundles for browsers without Node builtins', async () => {
  const result = await build({ entryPoints: ['lib/api/mini-run.ts'], bundle: true, platform: 'browser', write: false, logLevel: 'silent', tsconfig: 'tsconfig.json' })
  assert.equal(result.errors.length, 0)
  assert.doesNotMatch(result.outputFiles[0].text, /require\(["']node:crypto["']\)/)
})
