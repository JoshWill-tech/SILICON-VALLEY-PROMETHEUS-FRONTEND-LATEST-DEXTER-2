import { createClient } from "@supabase/supabase-js";
import { OAuthState } from "./types";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function storeState(state: string, data: OAuthState): Promise<void> {
  const { error } = await supabaseAdmin.from("oauth_states").insert({
    state,
    user_id: data.userId,
    provider: data.provider,
    code_verifier: data.codeVerifier,
    redirect_uri: data.redirectUri,
    expires_at: new Date(data.expiresAt).toISOString(),
  });
  if (error) throw error;
}

export async function getAndDeleteState(state: string): Promise<OAuthState | null> {
  await supabaseAdmin.from("oauth_states").delete().lt("expires_at", new Date().toISOString());
  const { data, error } = await supabaseAdmin.from("oauth_states").select("*").eq("state", state).single();
  if (error || !data) return null;
  await supabaseAdmin.from("oauth_states").delete().eq("state", state);
  return {
    userId: data.user_id,
    provider: data.provider,
    codeVerifier: data.code_verifier,
    redirectUri: data.redirect_uri,
    expiresAt: new Date(data.expires_at).getTime(),
  };
}
