import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function postToFacebook(userId: string, videoUrl: string, caption: string) {
  const provider = "facebook";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("Facebook not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({
    ciphertext: connection.encrypted_access_token,
    iv: connection.iv,
    keyVersion: connection.key_version,
  });

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/me/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        file_url: videoUrl,
        description: caption,
        access_token: accessToken
      }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Facebook upload failed");

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, postId: data.id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
