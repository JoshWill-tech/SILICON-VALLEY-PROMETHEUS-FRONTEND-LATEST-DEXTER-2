import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { OAuthState } from "./types";

let supabaseAdmin: SupabaseClient | null | undefined;

function getSupabaseAdminClient() {
  if (supabaseAdmin !== undefined) {
    return supabaseAdmin;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    supabaseAdmin = null;
    return supabaseAdmin;
  }

  supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

export async function storeState(state: string, data: OAuthState): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("OAuth state store is not configured.");
  }

  const { error } = await client.from("oauth_states").insert({
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
  const client = getSupabaseAdminClient();
  if (!client) return null;

  await client.from("oauth_states").delete().lt("expires_at", new Date().toISOString());
  const { data, error } = await client.from("oauth_states").select("*").eq("state", state).single();
  if (error || !data) return null;
  await client.from("oauth_states").delete().eq("state", state);
  return {
    userId: data.user_id,
    provider: data.provider,
    codeVerifier: data.code_verifier,
    redirectUri: data.redirect_uri,
    expiresAt: new Date(data.expires_at).getTime(),
  };
}
