import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteR2Object } from '@/lib/r2/delete-object'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch the asset record to get storage details and verify ownership
    const { data: asset, error: fetchError } = await supabase
      .from('source_assets')
      .select('id, user_id, storage_bucket, storage_path')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !asset) {
      console.warn('[ASSET_DELETE_NOT_FOUND]', { assetId, userId: user.id, error: fetchError })
      return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 })
    }

    const bucket = asset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources'
    const objectKey = asset.storage_path

    // 2. Delete the R2 object if the path exists
    if (objectKey) {
      try {
        await deleteR2Object(bucket, objectKey)
      } catch (r2Error: any) {
        // If the error is "NoSuchKey", we proceed with metadata deletion as it's already "gone" from storage
        if (r2Error.name !== 'NoSuchKey') {
          console.error('[ASSET_DELETE_R2_FAILED]', { assetId, bucket, objectKey, error: r2Error })
          return NextResponse.json(
            { error: 'Failed to delete file from storage', message: r2Error.message },
            { status: 500 }
          )
        }
        console.warn('[ASSET_DELETE_R2_MISSING]', { assetId, bucket, objectKey })
      }
    }

    // 3. Delete the metadata record from Supabase
    // Note: Database FK constraint ON DELETE SET NULL handles clearing projects.source_asset_id
    const { error: deleteError } = await supabase
      .from('source_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[ASSET_DELETE_SUPABASE_FAILED]', { assetId, error: deleteError })
      throw deleteError
    }

    return NextResponse.json({ ok: true, deletedAssetId: assetId })
  } catch (err: any) {
    console.error('[ASSET_DELETE_ERROR]', err)
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 }
    )
  }
}
