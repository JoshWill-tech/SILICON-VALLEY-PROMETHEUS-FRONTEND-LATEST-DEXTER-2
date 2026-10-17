import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {ESLint} from 'eslint'

const files = [
  'hooks/use-voice-companion.ts',
  'lib/voice-companion/source-status.ts',
  'lib/voice-companion/export-status.ts',
  'lib/voice-companion/gemini-live-client.ts',
  'app/api/projects/[id]/exports/route.ts',
  'tests/jarvis-end-to-end-session.test.mjs',
  'tests/jarvis-mp4-session.test.mjs',
  'scripts/verify-jarvis-session-lint.mjs',
]
const added = new Set([
  'lib/voice-companion/source-status.ts',
  'tests/jarvis-end-to-end-session.test.mjs',
  'scripts/verify-jarvis-session-lint.mjs',
])
const linter = new ESLint()
const fingerprint = message => `${message.ruleId}:${message.message}`
let baselineErrors = 0
let currentErrors = 0
const introduced = []
for (const file of files) {
  const original = added.has(file) ? '' : spawnSync('git', ['show', `HEAD:${file}`], {encoding: 'utf8', maxBuffer: 2 ** 22})
  if (original) assert.equal(original.status, 0, `could not read baseline for ${file}`)
  const baseline = await linter.lintText(original ? original.stdout : '', {filePath: file})
  const current = await linter.lintFiles([file])
  const counts = new Map()
  for (const message of baseline.flatMap(result => result.messages).filter(message => message.severity === 2)) {
    baselineErrors++
    const key = fingerprint(message)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  for (const message of current.flatMap(result => result.messages).filter(message => message.severity === 2)) {
    currentErrors++
    const key = fingerprint(message)
    const remaining = counts.get(key) ?? 0
    if (remaining > 0) counts.set(key, remaining - 1)
    else introduced.push(`${file}:${message.line}: ${key}`)
  }
}
assert.deepEqual(introduced, [], `introduced lint errors:\n${introduced.join('\n')}`)
console.log(`JARVIS_SESSION_LINT_PASSED baselineErrors=${baselineErrors} currentErrors=${currentErrors} introducedErrors=${introduced.length}`)
