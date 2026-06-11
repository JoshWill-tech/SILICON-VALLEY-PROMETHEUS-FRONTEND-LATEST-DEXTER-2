import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./client";

/**
 * Uploads a transcript JSON payload to Cloudflare R2.
 * This should only be called from server-side route handlers.
 */
export async function uploadTranscriptToR2(bucket: string, key: string, payload: any): Promise<string> {
  const jsonContent = JSON.stringify(payload);
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: jsonContent,
    ContentType: "application/json",
  });

  try {
    await r2Client.send(command);
    return key;
  } catch (err) {
    console.error('[lib/r2/upload-transcript] Upload error:', err);
    throw new Error('Failed to upload transcript to R2');
  }
}
