import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function postToLinkedIn(userId: string, videoUrl: string, caption: string) {
  const provider = "linkedin";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("LinkedIn not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({
    ciphertext: connection.encrypted_access_token,
    iv: connection.iv,
    keyVersion: connection.key_version,
  });

  try {
    // LinkedIn post flow (simplified)
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: `urn:li:person:${connection.provider_user_id}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: caption },
            shareMediaCategory: "NONE"
          }
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
      }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "LinkedIn post failed");

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, postId: data.id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
