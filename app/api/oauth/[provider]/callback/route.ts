import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDER_CONFIGS } from "@/lib/oauth/providers";
import { getAndDeleteState } from "@/lib/oauth/state-store";
import { sealToken } from "@/lib/crypto/token-vault";
import { OAuthProvider } from "@/lib/oauth/types";

export async function GET(request: NextRequest, { params }: any) {
  const provider = (await params).provider as OAuthProvider;
  const config = PROVIDER_CONFIGS[provider];
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return NextResponse.redirect(new URL(`/settings/social-accounts?error=${provider}&reason=${error}`, request.url));
  if (!code || !state) return NextResponse.redirect(new URL(`/settings/social-accounts?error=invalid_request`, request.url));

  const stateData = await getAndDeleteState(state);
  if (!stateData || stateData.provider !== provider) return NextResponse.redirect(new URL(`/settings/social-accounts?error=invalid_state`, request.url));

  // Surgical Fix: Dynamic Env Var Mapping and detailed logging
  const clientIdEnv = config.clientIdEnvVar || `${provider.toUpperCase()}_CLIENT_ID`;
  const clientSecretEnv = `${provider.toUpperCase()}_CLIENT_SECRET`;
  
  const clientId = process.env[clientIdEnv];
  const clientSecret = process.env[clientSecretEnv];

  if (!clientId || !clientSecret) {
    console.error(`[OAuth Callback] Missing credentials for ${provider}. Checked: ${clientIdEnv}, ${clientSecretEnv}`);
    return NextResponse.redirect(new URL(`/settings/social-accounts?error=server_config`, request.url));
  }

  const paramsBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: stateData.redirectUri,
    grant_type: "authorization_code",
  });

  if (config.pkce) {
    paramsBody.append("code_verifier", stateData.codeVerifier);
  }

  try {
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramsBody,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[OAuth Token Exchange Error] Provider: ${provider}, Status: ${tokenResponse.status}, Response:`, errorText);
      return NextResponse.redirect(new URL(`/settings/social-accounts?error=token_exchange&provider=${provider}`, request.url));
    }

    const tokenData = await tokenResponse.json();
    const sealedAccess = await sealToken(tokenData.access_token);
    const sealedRefresh = tokenData.refresh_token ? await sealToken(tokenData.refresh_token) : null;

    const supabase = await createClient();
    const { error: dbError } = await supabase.from("user_connections").upsert({
      user_id: stateData.userId,
      provider,
      encrypted_access_token: sealedAccess.ciphertext,
      encrypted_refresh_token: sealedRefresh?.ciphertext || null,
      iv: sealedAccess.iv,
      key_version: sealedAccess.keyVersion,
      scope: config.scopes.join(config.scopeSeparator),
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      is_active: true,
    }, { onConflict: "user_id,provider" });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.redirect(new URL(`/settings/social-accounts?error=database`, request.url));
    }

    // Clear memory
    tokenData.access_token = null;
    if (tokenData.refresh_token) tokenData.refresh_token = null;

    return NextResponse.redirect(new URL(`/settings/social-accounts?success=${provider}`, request.url));
  } catch (err: any) {
    console.error(`[OAuth Callback Fatal Error] Provider: ${provider}`, err);
    return NextResponse.redirect(new URL(`/settings/social-accounts?error=callback_fatal&provider=${provider}`, request.url));
  }
}
