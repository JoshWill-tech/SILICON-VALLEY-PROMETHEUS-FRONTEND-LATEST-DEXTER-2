import { burnToken } from "@/lib/crypto/token-vault";
import { logAudit } from "@/lib/audit";
import { getValidAccessToken } from "@/lib/oauth/refresh";

export async function saveToDrive(
  userId: string,
  fileUrl: string,
  fileName: string,
  extraMetadata: { folderId?: string; description?: string } = {}
) {
  const provider = "google_drive";
  const accessToken = await getValidAccessToken(userId, provider);
  if (!accessToken) throw new Error("Google Drive is not connected or token expired. Please connect in Settings.");

  await logAudit(userId, "token_decrypted", provider, true);

  try {
    // Step 1: Create file metadata
    const metadataBody: Record<string, any> = {
      name: fileName,
      mimeType: "video/mp4",
    };
    if (extraMetadata?.folderId) {
      metadataBody.parents = [extraMetadata.folderId];
    }
    if (extraMetadata?.description) {
      metadataBody.description = extraMetadata.description;
    }

    const metadataRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(metadataBody),
    });
    
    const metadata = await metadataRes.json();
    if (!metadataRes.ok) throw new Error(metadata.error?.message || "Drive metadata creation failed");

    // Step 2: Upload content
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) throw new Error(`Could not read source file for Google Drive upload (HTTP ${fileRes.status})`);
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
    return {
      success: true,
      fileId: metadata.id,
      webViewLink: metadata.webViewLink || `https://drive.google.com/file/d/${metadata.id}/view`,
    };
  } catch (err: any) {
    await logAudit(userId, "export_completed", provider, false, err.message);
    throw err;
  } finally {
    burnToken(accessToken);
  }
}
