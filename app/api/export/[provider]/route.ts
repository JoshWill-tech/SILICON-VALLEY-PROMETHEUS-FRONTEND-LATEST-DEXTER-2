import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { distributeContent } from "@/lib/social";
import { OAuthProvider } from "@/lib/oauth/types";
import { exportRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: any) {
  const provider = (await params).provider as OAuthProvider;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success: rateLimitOk } = await exportRateLimit.limit(user.id);
  if (!rateLimitOk) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  try {
    const body = await request.json();
    const { videoUrl, caption, ...metadata } = body;
    
    if (!videoUrl) return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    
    const result = await distributeContent(user.id, provider, videoUrl, caption || "", metadata);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error(`[Export ${provider} Error]`, e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
