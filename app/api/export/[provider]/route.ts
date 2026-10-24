import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { distributeContent } from "@/lib/social";
import { OAuthProvider } from "@/lib/oauth/types";
import { exportRateLimit } from "@/lib/rate-limit";
import { configuredOAuthProviders } from '@/lib/oauth/capabilities';
import { computeErrorResponse, reserveCompute, settleCompute } from '@/lib/compute/credits';
import { parseComputeConfirmation } from '@/lib/compute/policy';
import { getPresignedGetUrl } from "@/lib/r2/presigned-url";
import { isDevBypassActive } from "@/lib/supabase/dev-bypass";

export async function POST(request: NextRequest, { params }: any) {
  const provider = (await params).provider as OAuthProvider;
  const supabase = await createClient();
  let { data: { user } } = await supabase.auth.getUser();
  if (!user && isDevBypassActive()) {
    user = { id: 'e261b522-9d57-4bfe-90c8-38b3720cec36', email: 'dev@prometheusstudio.tech' } as any;
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!configuredOAuthProviders().includes(provider)) return NextResponse.json({ error: 'This destination is not configured.' }, { status: 503 });

  const { success: rateLimitOk } = await exportRateLimit.limit(user.id);
  if (!rateLimitOk) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  let reservation: string | null = null;
  try {
    const body = await request.json();
    const { videoUrl, caption, projectId, assetId, sourceAssetId, exportId, ...metadata } = body;

    let effectiveVideoUrl: string | null = null;
    let effectiveFileName: string = metadata.fileName || metadata.title || `export-${Date.now()}.mp4`;

    // 1. Resolve source asset (V1 original upload) if asset ID provided
    const targetAssetId = assetId || sourceAssetId;
    if (targetAssetId) {
      const { data: asset } = await supabase
        .from('source_assets')
        .select('id, storage_bucket, storage_path, original_filename')
        .eq('id', targetAssetId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (asset && asset.storage_path) {
        const bucket = asset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources';
        effectiveFileName = metadata.fileName || asset.original_filename || 'source-video.mp4';
        effectiveVideoUrl = await getPresignedGetUrl(bucket, asset.storage_path, effectiveFileName, 3600);
      }
    }

    // 2. Resolve rendered export if exportId provided
    if (!effectiveVideoUrl && exportId) {
      const { data: exp } = await supabase
        .from('project_exports')
        .select('id, storage_bucket, storage_path, metadata')
        .eq('id', exportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (exp && exp.storage_path) {
        const bucket = exp.storage_bucket || process.env.R2_BUCKET_EXPORTS || 'prometheus-exports';
        effectiveFileName = metadata.fileName || 'export.mp4';
        effectiveVideoUrl = await getPresignedGetUrl(bucket, exp.storage_path, effectiveFileName, 3600);
      }
    }

    // 3. Resolve via projectId (project's V1 original upload or latest export)
    if (!effectiveVideoUrl && projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('id, source_asset_id, title')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (project) {
        let asset: any = null;
        if (project.source_asset_id) {
          const { data: a } = await supabase
            .from('source_assets')
            .select('id, storage_bucket, storage_path, original_filename')
            .eq('id', project.source_asset_id)
            .eq('user_id', user.id)
            .maybeSingle();
          if (a) asset = a;
        }
        if (!asset) {
          const { data: a } = await supabase
            .from('source_assets')
            .select('id, storage_bucket, storage_path, original_filename')
            .eq('project_id', project.id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (a) asset = a;
        }

        if (asset && asset.storage_path) {
          const bucket = asset.storage_bucket || process.env.R2_BUCKET_SOURCES || 'prometheus-sources';
          effectiveFileName = metadata.fileName || asset.original_filename || `${project.title || 'project'}-v1.mp4`;
          effectiveVideoUrl = await getPresignedGetUrl(bucket, asset.storage_path, effectiveFileName, 3600);
        }
      }
    }

    // 4. Resolve directly passed videoUrl
    if (!effectiveVideoUrl && videoUrl) {
      const sourceUrl = new URL(videoUrl);
      if (sourceUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'A stored HTTPS source is required for publishing.' }, { status: 400 });
      }
      effectiveVideoUrl = videoUrl;
    }

    if (!effectiveVideoUrl) {
      return NextResponse.json({ error: 'Source video could not be resolved for export.' }, { status: 400 });
    }

    // Check account connection
    const { data: connection } = await supabase
      .from('user_connections')
      .select('is_active, expires_at, encrypted_refresh_token')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .maybeSingle();

    if (!connection?.is_active) {
      return NextResponse.json({ error: `Please connect your ${provider.replace('_', ' ')} account in Settings before exporting.` }, { status: 409 });
    }

    reservation = await reserveCompute(user.id, 'export', parseComputeConfirmation(body), provider);
    
    const result = await distributeContent(user.id, provider, effectiveVideoUrl, caption || metadata.title || "", {
      ...metadata,
      fileName: effectiveFileName,
    });

    await settleCompute(user.id, reservation, 'completed');
    return NextResponse.json({
      provider,
      ...result,
    });
  } catch (e: any) {
    console.error(`[Export ${provider} Error]`, e);
    if (reservation) await settleCompute(user.id, reservation, 'refunded');
    const creditError = computeErrorResponse(e);
    return creditError ?? NextResponse.json({ error: e?.message || 'Publishing could not finish. Please check your account connection and try again.' }, { status: 502 });
  }
}
