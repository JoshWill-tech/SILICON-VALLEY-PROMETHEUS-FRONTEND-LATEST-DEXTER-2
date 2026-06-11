import { execFile } from 'child_process'
import { randomUUID } from 'crypto'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

type FpcalcResult = {
  fingerprint?: string
  duration?: number
}

export async function generateFingerprint(audioBuffer: ArrayBuffer): Promise<{ fingerprint: string; duration: number }> {
  const tempPath = join(tmpdir(), `prometheus-${Date.now()}-${randomUUID()}.mp3`)
  await writeFile(tempPath, Buffer.from(audioBuffer))

  try {
    const { stdout } = await runFpcalc(tempPath)
    const result = JSON.parse(stdout) as FpcalcResult

    if (!result.fingerprint || typeof result.fingerprint !== 'string') {
      throw new Error('fpcalc did not return a fingerprint.')
    }

    if (typeof result.duration !== 'number' || !Number.isFinite(result.duration)) {
      throw new Error('fpcalc did not return a valid duration.')
    }

    return { fingerprint: result.fingerprint, duration: result.duration }
  } finally {
    await unlink(tempPath).catch(() => undefined)
  }
}

async function runFpcalc(tempPath: string) {
  const errors: unknown[] = []

  for (const binary of getFpcalcCandidates()) {
    try {
      return await execFileAsync(binary, ['-json', tempPath], { timeout: 30000 })
    } catch (error) {
      errors.push(error)
    }
  }

  const error = new Error('fpcalc binary unavailable. Install libchromaprint-tools or keep fpcalc-wrapper installed.')
  error.cause = errors
  throw error
}

function getFpcalcCandidates() {
  const localBinary = join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'fpcalc.cmd' : 'fpcalc')
  return [...new Set([process.env.FPCALC_PATH?.trim(), localBinary, 'fpcalc'].filter((value): value is string => Boolean(value)))]
}
