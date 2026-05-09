import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./client";

/**
 * Deletes an object from Cloudflare R2.
 * This must be called from a server environment.
 */
export async function deleteR2Object(bucket: string, objectKey: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    const response = await r2Client.send(command);
    return response;
  } catch (error) {
    console.error("[R2_DELETE_ERROR]", { bucket, objectKey, error });
    throw error;
  }
}
