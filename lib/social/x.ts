import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function postToX(userId: string, videoUrl: string, caption: string) {
  const provider = "x";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("X not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({
    ciphertext: connection.encrypted_access_token,
    iv: connection.iv,
    keyVersion: connection.key_version,
  });

  try {
    // X API v2 uses media upload (v1.1) then tweet (v2)
    // Simplified flow:
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        text: caption,
        // media: { media_ids: [mediaId] } // Requires separate upload
      }),
    });
    
    const tweetData = await tweetRes.json();
    if (!tweetRes.ok) throw new Error(tweetData.detail || "X tweet failed");

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, postId: tweetData.data.id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
