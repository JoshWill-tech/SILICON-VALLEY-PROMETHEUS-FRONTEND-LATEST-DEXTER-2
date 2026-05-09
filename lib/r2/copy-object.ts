import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./client";

/**
 * Copies an object within or between R2 buckets.
 * This must be called from a server environment.
 */
export async function copyR2Object(
  sourceBucket: string,
  sourceKey: string,
  destBucket: string,
  destKey: string
) {
  try {
    const command = new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: encodeURIComponent(`${sourceBucket}/${sourceKey}`),
    });

    const response = await r2Client.send(command);
    return response;
  } catch (error) {
    console.error("[R2_COPY_ERROR]", { sourceBucket, sourceKey, destBucket, destKey, error });
    throw error;
  }
}
