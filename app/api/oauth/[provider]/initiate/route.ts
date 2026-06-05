import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDER_CONFIGS } from "@/lib/oauth/providers";
import { storeState } from "@/lib/oauth/state-store";
import { OAuthProvider } from "@/lib/oauth/types";
import { oauthRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: NextRequest, { params }: any) {
  const provider = (await params).provider as OAuthProvider;
  const config = PROVIDER_CONFIGS[provider];
  if (!config) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });

  // P0 Fix: Robust Environment Variable Mapping
  const envVarName = config.clientIdEnvVar || `${provider.toUpperCase()}_CLIENT_ID`;
  const clientId = process.env[envVarName];

  // Server-side guard: Throw 500 if env var is missing
  if (!clientId) {
    console.error(`[OAuth Initiate] Missing environment variable: ${envVarName}`);
    return NextResponse.json(
      { error: `Server configuration error: Missing ${envVarName}` }, 
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success: rateLimitOk } = await oauthRateLimit.limit(user.id);
  if (!rateLimitOk) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const codeVerifier = crypto.randomBytes(128).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const state = crypto.randomBytes(32).toString("hex");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${provider}/callback`;

  await storeState(state, { userId: user.id, provider, codeVerifier, redirectUri, expiresAt: Date.now() + 10 * 60 * 1000 });

  const url = new URL(config.authorizeUrl);

  // P0 Fix: TikTok specifically requires client_key, others use client_id
  const clientIdParamName = config.clientIdParam || "client_id";
  url.searchParams.set(clientIdParamName, clientId);

  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(config.scopeSeparator));
  url.searchParams.set("state", state);

  if (config.pkce) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  if (provider === "google_drive" || provider === "youtube") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  }

  return NextResponse.json({ url: url.toString() });
}
