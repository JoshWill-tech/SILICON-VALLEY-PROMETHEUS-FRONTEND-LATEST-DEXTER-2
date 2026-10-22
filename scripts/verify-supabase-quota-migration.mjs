import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20261023000000_unlimited_storage_and_quota_prophylaxis.sql';
assert.ok(existsSync(migrationPath), 'migration file must exist');

const sql = readFileSync(migrationPath, 'utf8');
assert.ok(sql.includes('109951162777600::bigint'), 'migration must define 100 TB allowance in maul_storage_limit_bytes');
assert.ok(sql.includes('maul_reserve_source_upload'), 'migration must update maul_reserve_source_upload');
assert.ok(sql.includes('maul_commit_source_revision'), 'migration must update maul_commit_source_revision');

console.log('supabase migration verified');
