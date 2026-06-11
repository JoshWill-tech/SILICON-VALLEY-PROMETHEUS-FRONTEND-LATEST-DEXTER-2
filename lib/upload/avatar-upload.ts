export const AVATAR_MAX_FILE_SIZE_BYTES = 5_242_880
export const AVATAR_UPLOAD_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export class AvatarUploadError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AvatarUploadError'
    this.code = code
  }
}

type AvatarUploadOptions = {
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
}

type AvatarUploadResponse = {
  success: true
  uploadUrl: string
  publicUrl: string
  key: string
}

type AvatarUploadErrorResponse = {
  success?: false
  error?: {
    message?: string
  }
}

export function validateAvatarFile(file: Pick<File, 'size' | 'type'>) {
  if (!AVATAR_UPLOAD_ACCEPTED_TYPES.includes(file.type as (typeof AVATAR_UPLOAD_ACCEPTED_TYPES)[number])) {
    throw new AvatarUploadError('INVALID_FILE_TYPE', 'Only JPG, PNG, WebP accepted.')
  }

  if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
    throw new AvatarUploadError('FILE_TOO_LARGE', 'Image must be under 5MB.')
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function compressAvatarFile(file: File) {
  const imageCompression = (await import('browser-image-compression')).default

  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 1024,
      initialQuality: 0.8,
      fileType: 'image/webp',
      useWebWorker: true,
    })
  } catch {
    throw new AvatarUploadError('COMPRESSION_FAILED', 'Unable to process image.')
  }
}

async function requestAvatarSignedUrl(
  payload: { contentType: string; fileSize: number },
  attempt = 0,
): Promise<AvatarUploadResponse> {
  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = (await response.json().catch(() => null)) as AvatarUploadResponse | AvatarUploadErrorResponse | null

  if (response.ok && body?.success) {
    return body
  }

  if (response.status === 401) {
    throw new AvatarUploadError('SESSION_EXPIRED', 'Session expired. Please sign in again.')
  }

  if (response.status >= 500 && response.status < 600 && attempt === 0) {
    await sleep(300)
    return requestAvatarSignedUrl(payload, 1)
  }

  const errorMessage =
    body && 'error' in body && body.error?.message
      ? body.error.message
      : response.status >= 500
        ? 'Server error. Please try again.'
        : 'Unable to prepare avatar upload.'

  throw new AvatarUploadError(
    'SIGNED_URL_FAILED',
    errorMessage,
  )
}

async function uploadBlobWithProgress(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: (progress: number) => void,
  attempt = 0,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    }

    xhr.onerror = async () => {
      if (attempt === 0) {
        await sleep(400)
        try {
          await uploadBlobWithProgress(uploadUrl, blob, contentType, onProgress, 1)
          resolve()
          return
        } catch (error) {
          reject(error)
          return
        }
      }

      reject(new AvatarUploadError('NETWORK_UPLOAD_FAILED', 'Upload failed. Check your connection.'))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }

      if (xhr.status === 403) {
        reject(new AvatarUploadError('UPLOAD_FORBIDDEN', 'Upload configuration error. Contact support.'))
        return
      }

      if (xhr.status >= 500 && attempt === 0) {
        void sleep(400).then(() =>
          uploadBlobWithProgress(uploadUrl, blob, contentType, onProgress, 1).then(resolve).catch(reject),
        )
        return
      }

      reject(new AvatarUploadError('UPLOAD_FAILED', 'Upload failed. Check your connection.'))
    }

    xhr.send(blob)
  })
}

export async function uploadAvatar(file: File, options: AvatarUploadOptions = {}) {
  try {
    validateAvatarFile(file)
    const compressedFile = await compressAvatarFile(file)
    const signedUpload = await requestAvatarSignedUrl({
      contentType: 'image/webp',
      fileSize: compressedFile.size,
    })

    await uploadBlobWithProgress(signedUpload.uploadUrl, compressedFile, 'image/webp', options.onProgress)

    return {
      publicUrl: signedUpload.publicUrl,
      key: signedUpload.key,
    }
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new AvatarUploadError('UPLOAD_FAILED', 'Upload failed.')
    options.onError?.(normalizedError)
    throw normalizedError
  }
}
