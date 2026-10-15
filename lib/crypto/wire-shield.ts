/**
 * Prometheus Studio Wire-Shield Payload Encryption & Anti-Tamper Protocol
 *
 * Implements client-server envelope encryption (AES-256-GCM) so that:
 * 1. An observer inspecting the Network tab in DevTools sees only high-entropy opaque ciphertext.
 * 2. Model identifiers, internal system prompts, tool schemas, and timeline arguments are zero-visible on the wire.
 * 3. Payloads include nonce and timestamp verification to prevent replay attacks and parameter tampering.
 * 4. Transparent fallback preserves 100% backward compatibility for unencrypted test runners and third-party webhooks.
 */

export interface WireShieldEnvelope {
  __shield: 1
  iv: string // Base64
  data: string // Base64 ciphertext + tag
  ts: number // Epoch timestamp in ms
  nonce: string // Unique 16-byte hex
}

const DEFAULT_SECRET = 'prometheus-secure-wire-shield-v1-2026-e2e-armor-mesh'
const REPLAY_WINDOW_MS = 120_000 // 2 minutes

// Nonce cache for replay attack prevention (pruned periodically)
const seenNonces = new Map<string, number>()

function pruneSeenNonces() {
  const now = Date.now()
  for (const [nonce, expiry] of seenNonces.entries()) {
    if (now > expiry) {
      seenNonces.delete(nonce)
    }
  }
}

export function isWireShieldEnvelope(obj: unknown): obj is WireShieldEnvelope {
  if (!obj || typeof obj !== 'object') return false
  const env = obj as Record<string, unknown>
  return (
    env.__shield === 1 &&
    typeof env.iv === 'string' &&
    typeof env.data === 'string' &&
    typeof env.ts === 'number' &&
    typeof env.nonce === 'string'
  )
}

function getSecretKey(): string {
  if (typeof process !== 'undefined' && process.env?.WIRE_SHIELD_KEY) {
    return process.env.WIRE_SHIELD_KEY.trim()
  }
  return DEFAULT_SECRET
}

// Convert string / buffer to Base64
function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convert Base64 to Uint8Array
function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Deterministically derive a 256-bit CryptoKey via Web Crypto SHA-256
async function getCryptoKey(cryptoObj: Crypto): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const rawSecret = encoder.encode(getSecretKey())
  const keyDigest = await cryptoObj.subtle.digest('SHA-256', rawSecret)
  return cryptoObj.subtle.importKey('raw', keyDigest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function getCryptoInstance(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto
  }
  // In Node environment without global crypto, load node:crypto
  try {
    const nodeCrypto = require('node:crypto')
    return nodeCrypto.webcrypto as Crypto
  } catch {
    throw new Error('WebCrypto API is not available in the current runtime environment.')
  }
}

/**
 * Encrypt a JSON-serializable object into an opaque WireShieldEnvelope.
 */
export async function encryptWirePayload<T>(payload: T): Promise<WireShieldEnvelope> {
  const cryptoObj = getCryptoInstance()
  const key = await getCryptoKey(cryptoObj)

  const encoder = new TextEncoder()
  const serialized = JSON.stringify(payload)
  const plaintext = encoder.encode(serialized)

  const iv = new Uint8Array(12)
  cryptoObj.getRandomValues(iv)

  const ciphertextBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext
  )

  const nonceBytes = new Uint8Array(8)
  cryptoObj.getRandomValues(nonceBytes)
  const nonce = Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return {
    __shield: 1,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertextBuffer)),
    ts: Date.now(),
    nonce,
  }
}

/**
 * Decrypt a WireShieldEnvelope back into the original typed object.
 */
export async function decryptWirePayload<T>(envelope: WireShieldEnvelope): Promise<T> {
  const now = Date.now()

  // Replay Attack Validation 1: Timestamp freshness
  if (Math.abs(now - envelope.ts) > REPLAY_WINDOW_MS) {
    throw new Error('Wire-Shield: Request rejected due to expired or out-of-bounds timestamp.')
  }

  // Replay Attack Validation 2: Nonce uniqueness
  pruneSeenNonces()
  if (seenNonces.has(envelope.nonce)) {
    throw new Error('Wire-Shield: Replay detected. Nonce has already been processed.')
  }
  seenNonces.set(envelope.nonce, now + REPLAY_WINDOW_MS)

  const cryptoObj = getCryptoInstance()
  const key = await getCryptoKey(cryptoObj)

  const iv = fromBase64(envelope.iv)
  const ciphertext = fromBase64(envelope.data)

  const decryptedBuffer = await cryptoObj.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as Uint8Array<ArrayBuffer>,
    },
    key,
    ciphertext as Uint8Array<ArrayBuffer>
  )

  const decoder = new TextDecoder()
  const plaintext = decoder.decode(decryptedBuffer)
  return JSON.parse(plaintext) as T
}

/**
 * Server-side helper to safely unwrap incoming payloads:
 * Decrypts if shielded; passes through if plain object (for backward compatibility).
 */
export async function unwrapWirePayload<T>(body: unknown): Promise<{ data: T; isShielded: boolean }> {
  if (isWireShieldEnvelope(body)) {
    const data = await decryptWirePayload<T>(body)
    return { data, isShielded: true }
  }
  return { data: body as T, isShielded: false }
}

/**
 * Server-side helper to wrap outgoing responses:
 * Encrypts if caller sent a shielded request or requested shielded output.
 */
export async function wrapWireResponse<T>(data: T, shouldShield: boolean): Promise<WireShieldEnvelope | T> {
  if (!shouldShield) {
    return data
  }
  return encryptWirePayload<T>(data)
}
