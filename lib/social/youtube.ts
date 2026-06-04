import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function uploadToYouTube(userId: string, videoUrl: string, metadata: { title: string; description: string; tags: string[] }) {
  const provider = "youtube";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("YouTube not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({ 
    ciphertext: connection.encrypted_access_token, 
    iv: connection.iv, 
    keyVersion: connection.key_version 
  });

  try {
    // Step 1: Create video resource
    const resourceRes = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,status", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        snippet: { 
          title: metadata.title, 
          description: metadata.description, 
          tags: metadata.tags, 
          categoryId: "22" 
        },
        status: { 
          privacyStatus: "private", 
          selfDeclaredMadeForKids: false 
        },
      }),
    });
    
    const resource = await resourceRes.json();
    if (!resourceRes.ok) throw new Error(resource.error?.message || "YouTube upload failed");

    // Step 2: Upload video bytes (simplified — in production, use resumable upload)
    const videoRes = await fetch(videoUrl);
    const videoBlob = await videoRes.blob();

    const uploadRes = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=media&part=snippet,status&id=${resource.id}`, {
      method: "PUT",
      headers: { 
        "Authorization": `Bearer ${accessToken}`, 
        "Content-Type": "video/*", 
        "Content-Length": String(videoBlob.size) 
      },
      body: videoBlob,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      throw new Error(errorData.error?.message || "YouTube media upload failed");
    }

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, videoId: resource.id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
