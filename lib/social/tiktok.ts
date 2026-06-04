import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function postToTikTok(userId: string, videoUrl: string, caption: string) {
  const provider = "tiktok";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("TikTok not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({
    ciphertext: connection.encrypted_access_token,
    iv: connection.iv,
    keyVersion: connection.key_version,
  });

  try {
    // Step 1: Initiate upload
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        source_info: { source: "PULL_FROM_URL", url: videoUrl }, 
        title: caption, 
        privacy_level: "PUBLIC" 
      }),
    });
    
    const initData = await initRes.json();
    if (!initRes.ok) throw new Error(initData.error?.message || "TikTok upload failed");

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, publishId: initData.data.publish_id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
