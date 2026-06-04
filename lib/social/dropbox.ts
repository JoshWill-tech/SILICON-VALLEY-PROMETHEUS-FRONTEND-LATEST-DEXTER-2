import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function postToDropbox(userId: string, fileUrl: string, fileName: string) {
  const provider = "dropbox";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("Dropbox not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({
    ciphertext: connection.encrypted_access_token,
    iv: connection.iv,
    keyVersion: connection.key_version,
  });

  try {
    // Dropbox upload (v2/files/save_url)
    const res = await fetch("https://api.dropboxapi.com/2/files/save_url", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        path: `/${fileName}`,
        url: fileUrl
      }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_summary || "Dropbox upload failed");

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, jobId: data.async_job_id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
