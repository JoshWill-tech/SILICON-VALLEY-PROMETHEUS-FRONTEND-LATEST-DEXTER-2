import fs from 'fs';
import https from 'https';

const SUPABASE_PAT = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT || process.argv[2];
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'svdhghdinmxiqbxrewqi';

if (!SUPABASE_PAT) {
  console.error('Error: SUPABASE_ACCESS_TOKEN or SUPABASE_PAT environment variable or CLI argument required.');
  process.exit(1);
}

async function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql });
    const req = https.request(
      {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_PAT}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${data}`));
            }
          } catch {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Executing migration against Supabase project [${PROJECT_REF}]...`);
  const sql = fs.readFileSync('EXECUTE_IN_SUPABASE_SQL_EDITOR.sql', 'utf8');
  
  const result = await runQuery(sql);
  console.log('Migration execution result:', JSON.stringify(result, null, 2));

  console.log('Verifying function public.maul_storage_limit_bytes directly in PostgreSQL...');
  const testUserId = '00000000-0000-0000-0000-000000000000';
  const verifyResult = await runQuery(`select public.maul_storage_limit_bytes('${testUserId}'::uuid) as limit_bytes;`);
  console.log('Verification query result:', JSON.stringify(verifyResult, null, 2));

  const limitBytes = verifyResult?.[0]?.limit_bytes ?? verifyResult?.result?.[0]?.limit_bytes;
  console.log(`Confirmed Limit Bytes: ${limitBytes} (Expected: 109951162777600)`);
  if (String(limitBytes) === '109951162777600') {
    console.log('SUCCESS: Supabase database functions are updated and 100 TB unlimited storage is LIVE!');
  } else {
    console.log('Notice: Verification result differs, check output above.');
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
