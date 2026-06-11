import { unsealToken, burnToken } from "@/lib/crypto/token-vault";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function saveToDrive(userId: string, fileUrl: string, fileName: string) {
  const provider = "google_drive";
  const supabase = await createClient();
  const { data: connection } = await supabase.from("user_connections")
    .select("*").eq("user_id", userId).eq("provider", provider).single();
  
  if (!connection) throw new Error("Google Drive not connected");

  await logAudit(userId, "token_decrypted", provider, true);
  const accessToken = await unsealToken({ 
    ciphertext: connection.encrypted_access_token, 
    iv: connection.iv, 
    keyVersion: connection.key_version 
  });

  try {
    // Step 1: Create file metadata
    const metadataRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: fileName, mimeType: "video/mp4" }),
    });
    
    const metadata = await metadataRes.json();
    if (!metadataRes.ok) throw new Error(metadata.error?.message || "Drive metadata creation failed");

    // Step 2: Upload content
    const fileRes = await fetch(fileUrl);
    const fileBlob = await fileRes.blob();

    const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${metadata.id}?uploadType=media`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${accessToken}`, 
        "Content-Type": "video/mp4", 
        "Content-Length": String(fileBlob.size) 
      },
      body: fileBlob,
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      throw new Error(errorData.error?.message || "Drive content upload failed");
    }

    await logAudit(userId, "export_completed", provider, true);
    return { success: true, fileId: metadata.id };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
