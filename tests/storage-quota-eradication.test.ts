import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { STORAGE_TIERS, getStorageLimit, formatStorage } from '../lib/storage-limits';
import { hasBillingAccess, readBillingAccessState } from '../lib/billing';

test('G1: storage tiers provide at least 100 TB for free tier and unlimited scale across all tiers', () => {
  const ONE_HUNDRED_TB = 100 * 1024 * 1024 * 1024 * 1024;
  assert.ok(STORAGE_TIERS.free.bytes >= ONE_HUNDRED_TB, 'free tier must have at least 100 TB allowance');
  assert.equal(getStorageLimit('free'), STORAGE_TIERS.free.bytes, 'getStorageLimit must match free tier allowance');
  assert.ok(STORAGE_TIERS.creator.bytes >= ONE_HUNDRED_TB, 'creator tier must have at least 100 TB allowance');
  assert.ok(STORAGE_TIERS.studio.bytes >= ONE_HUNDRED_TB, 'studio tier must have at least 100 TB allowance');
  assert.ok(STORAGE_TIERS.cinema.bytes >= ONE_HUNDRED_TB, 'cinema tier must have at least 100 TB allowance');
});

test('G2: formatStorage formats 100 TB cleanly', () => {
  const formatted = formatStorage(100 * 1024 * 1024 * 1024 * 1024);
  assert.equal(formatted, '100.00 TB');
});

test('G3: billing access is active unconditionally for all accounts', () => {
  assert.equal(hasBillingAccess(), true, 'hasBillingAccess must return true');
  const state = readBillingAccessState();
  assert.equal(state.status, 'active', 'readBillingAccessState status must be active');
});

test('G4: database migration defines matching 100 TB allowance in SQL functions', () => {
  const migrations = readdirSync('supabase/migrations')
    .filter(name => name.endsWith('.sql'))
    .sort();
  
  let latestLimitDef = '';
  for (const name of migrations) {
    const sql = readFileSync(`supabase/migrations/${name}`, 'utf8');
    const matches = [...sql.matchAll(/create or replace function public\.maul_storage_limit_bytes\([\s\S]*?\$\$;/gi)];
    if (matches.length) latestLimitDef = matches.at(-1)![0];
  }

  assert.ok(latestLimitDef, 'maul_storage_limit_bytes function must exist');
  const freeBytes = Number(latestLimitDef.match(/else\s+(\d+)::bigint/i)?.[1]);
  assert.equal(freeBytes, STORAGE_TIERS.free.bytes, 'database free allowance must equal STORAGE_TIERS.free.bytes (100 TB)');

  for (const tier of ['creator', 'studio', 'cinema'] as const) {
    const bytes = Number(latestLimitDef.match(new RegExp(`when '${tier}' then (\\d+)::bigint`, 'i'))?.[1]);
    assert.equal(bytes, STORAGE_TIERS[tier].bytes, `${tier} database quota must match frontend allowance`);
  }
});

test('G5: multi-gigabyte upload sizes fit effortlessly within free allowance', () => {
  const GiB = 1024 * 1024 * 1024;
  const freeAllowance = STORAGE_TIERS.free.bytes;

  // 10 GB file
  const tenGbFile = 10 * GiB;
  assert.ok(tenGbFile < freeAllowance, '10 GB file must easily fit in free allowance');

  // Multiple 5 GB files accumulated
  const multipleUploads = 50 * GiB;
  assert.ok(multipleUploads < freeAllowance, '50 GB accumulated uploads must easily fit in free allowance');
});
