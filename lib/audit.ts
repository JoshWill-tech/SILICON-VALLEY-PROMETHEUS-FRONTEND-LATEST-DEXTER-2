import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logAudit(
  userId: string, 
  action: string, 
  provider?: string, 
  success?: boolean, 
  error?: string
) {
  try {
    await supabaseAdmin.from("audit_logs").insert({
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
