'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'

export type SourceAssetV2 = {
  id: string
  project_id?: string | null
  file_name?: string | null
  name?: string | null
  mime_type?: string | null
  type?: string | null
  size_bytes?: number | null
  storage_path?: string | null
  public_url?: string | null
  created_at?: string | null
  [key: string]: unknown
}

export const DEFAULT_STORAGE_QUOTA_BYTES = 100 * 1024 * 1024 * 1024

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

export function getSourceAssetDisplayName(asset: SourceAssetV2) {
  return asset.file_name?.trim() || asset.name?.trim() || 'Untitled asset'
}

export function useSourceAssets(projectId: string | null | undefined) {
  const [assets, setAssets] = React.useState<SourceAssetV2[]>([])
  const [loading, setLoading] = React.useState(Boolean(projectId))
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let disposed = false

    async function fetchAssets() {
      if (!projectId) {
        setAssets([])
        setLoading(false)
        setError('Project id is required.')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data, error: queryError } = await supabase
          .from('source_assets')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (disposed) return

        if (queryError) {
          setError(queryError.message)
          setAssets([])
          return
        }

        setAssets((data ?? []) as SourceAssetV2[])
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : 'Unable to load source assets.')
      } finally {
        if (!disposed) setLoading(false)
      }
    }

    void fetchAssets()

    return () => {
      disposed = true
    }
  }, [projectId])

  const storageUsed = React.useMemo(
    () => assets.reduce((sum, asset) => sum + (typeof asset.size_bytes === 'number' ? asset.size_bytes : 0), 0),
    [assets],
  )

  return {
    assets,
    loading,
    error,
    storageUsed,
    storageQuota: DEFAULT_STORAGE_QUOTA_BYTES,
    storageUsedLabel: formatBytes(storageUsed),
    storageQuotaLabel: formatBytes(DEFAULT_STORAGE_QUOTA_BYTES),
    empty: !loading && !error && assets.length === 0,
  }
}
