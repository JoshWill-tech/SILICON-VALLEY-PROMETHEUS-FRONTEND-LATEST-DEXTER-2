import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function postToInstagram(userId: string, videoUrl: string, caption: string) {
  const provider = "instagram";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("Instagram not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({
    ciphertext: connection.encrypted_access_token,
    iv: connection.iv,
    keyVersion: connection.key_version,
  });

  try {
    // Note: Instagram Reels API requires a two-step process: container creation + media publish
    // This is a simplified representation of the flow
    
    // Step 1: Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v18.0/${connection.provider_user_id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        media_type: "REELS",
        video_url: videoUrl,
        caption: caption,
        access_token: accessToken
      }),
    });
    
    const containerData = await containerRes.json();
    if (!containerRes.ok) throw new Error(containerData.error?.message || "Instagram container creation failed");

    // Step 2: Publish media (usually needs to wait for processing, but this is the trigger)
    const publishRes = await fetch(`https://graph.facebook.com/v18.0/${connection.provider_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        creation_id: containerData.id,
        access_token: accessToken
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok) throw new Error(publishData.error?.message || "Instagram publish failed");

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, postId: publishData.id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
