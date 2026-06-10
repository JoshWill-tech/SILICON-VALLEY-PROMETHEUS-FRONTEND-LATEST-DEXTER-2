'use client'

import { useCallback, useState } from 'react'

import { uploadAvatar } from '@/lib/upload/avatar-upload'

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const upload = useCallback(async (file: File) => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const result = await uploadAvatar(file, {
        onProgress: setProgress,
      })

      return result
    } catch (caught) {
      const normalizedError = caught instanceof Error ? caught : new Error('Upload failed')
      setError(normalizedError)
      throw normalizedError
    } finally {
      setIsUploading(false)
    }
  }, [])

  return {
    upload,
    isUploading,
    progress,
    error,
    reset: () => setError(null),
  }
}
