import { cp, mkdir, readdir, symlink } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import nextEnv from '@next/env'

// A separate project directory avoids disturbing another task's .next lock.
// Source/dependencies stay linked; only configuration files and build output
// are copied. Environment values remain in process memory, never staged files.
const root = process.cwd()
const staging = resolve('.tmp', `thumbnail-production-${Date.now()}`)
await mkdir(staging, { recursive: true })
const excluded = new Set(['node_modules', 'tmp', 'out', 'build', 'artifacts', 'audit-artifacts', 'scratch'])
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.name.startsWith('.') || excluded.has(entry.name)) continue
  const source = join(root, entry.name)
  const destination = join(staging, entry.name)
  if (entry.isDirectory()) await symlink(source, destination, process.platform === 'win32' ? 'junction' : 'dir')
  else if (/\.(?:json|[cm]?js|tsx?)$/.test(entry.name)) await cp(source, destination)
}
await symlink(join(root, 'node_modules'), join(staging, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
nextEnv.loadEnvConfig(root, false)
console.log(`Isolated production build directory: ${staging}`)
const child = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', 'npm.cmd run build'] : ['run', 'build'], {
  cwd: staging, env: { ...process.env, NODE_ENV: 'production', DEV_AUTH_BYPASS: 'false' }, stdio: 'inherit', windowsHide: true,
})
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
