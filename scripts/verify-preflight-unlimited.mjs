import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const content = readFileSync('lib/r2/project-source-multipart.ts', 'utf8');

// Ensure that subscription errors and assets errors fall back gracefully rather than throwing
assert.ok(!content.includes('throw subscriptionError'), 'must not throw subscriptionError');
assert.ok(!content.includes('throw assetsError'), 'must not throw assetsError');

console.log('upload preflight quota check disabled');
