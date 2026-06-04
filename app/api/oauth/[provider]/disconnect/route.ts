import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDER_CONFIGS } from "@/lib/oauth/providers";
import { unsealToken } from "@/lib/crypto/token-vault";
import { OAuthProvider } from "@/lib/oauth/types";

export async function POST(request: NextRequest, { params }: any) {
  const provider = (await params).provider as OAuthProvider;
  const config = PROVIDER_CONFIGS[provider];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connection } = await supabase.from("user_connections").select("*").eq("user_id", user.id).eq("provider", provider).single();
  if (!connection) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  if (config.revokeUrl && connection.encrypted_access_token) {
    try {
      const accessToken = await unsealToken({ 
        ciphertext: connection.encrypted_access_token, 
        iv: connection.iv, 
        keyVersion: connection.key_version 
      });
      await fetch(config.revokeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ 
          token: accessToken, 
          client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`]! 
        }),
      });
    } catch (e) { 
      console.error("Revocation failed:", e); 
    }
  }

  await supabase.from("user_connections").delete().eq("user_id", user.id).eq("provider", provider);
  return NextResponse.json({ success: true });
}
