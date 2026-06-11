import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

  supabaseAdmin = createClient(url, serviceRoleKey);
  return supabaseAdmin;
}

export async function logAudit(
  userId: string, 
  action: string, 
  provider?: string, 
  success?: boolean, 
  error?: string
) {
  try {
    const client = getSupabaseAdminClient();
    if (!client) return;

    await client.from("audit_logs").insert({
      user_id: userId,
      action,
      provider,
      ip_address: null, // populated from request headers in API routes if passed
      user_agent: null,
      success,
      error_message: error,
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}
