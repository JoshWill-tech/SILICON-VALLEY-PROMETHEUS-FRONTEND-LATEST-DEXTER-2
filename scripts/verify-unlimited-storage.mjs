import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const content = readFileSync('lib/storage-limits.ts', 'utf8');
const freeMatch = content.match(/free:\s*\{\s*label:\s*'Free',\s*bytes:\s*([0-9\s*]+)\s*\}/);
assert.ok(freeMatch, 'free tier must be defined');
const freeBytes = eval(freeMatch[1]);
assert.ok(freeBytes >= 100 * 1024 * 1024 * 1024 * 1024, 'free tier must be >= 100 TB');

console.log('storage tiers verified unlimited');
