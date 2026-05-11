import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./client";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export interface UploadOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Uploads a local file to a Cloudflare R2 bucket using streams.
 * This must be called from a server environment.
 * Implements manual retry logic to ensure streams are recreated on failure.
 */
export async function uploadFileToR2(
  localFilePath: string,
  bucket: string,
  key: string,
  contentType: string = "video/mp4",
  options: UploadOptions = {}
) {
  const { maxAttempts = 3, retryDelayMs = 1000 } = options;
  let lastError: any;

  // 1. Get file stats once for Content-Length
  const stats = await fs.stat(localFilePath);
  const fileSizeMb = (stats.size / 1024 / 1024).toFixed(2);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.info(
        `[R2_UPLOAD] Attempt ${attempt}/${maxAttempts}: Uploading ${path.basename(
          localFilePath
        )} (${fileSizeMb} MB) to ${bucket}/${key}...`
      );

      // 2. Create a FRESH read stream for EVERY attempt
      // This is critical because streams cannot be reused after failure/consumption
      const fileStream = createReadStream(localFilePath);

      // 3. Prepare upload command
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        ContentLength: stats.size,
      });

      // 4. Execute upload
      const response = await r2Client.send(command);

      console.info(`[R2_UPLOAD] ✅ Success on attempt ${attempt}`);

      return {
        success: true,
        bucket,
        key,
        fileSize: stats.size,
        etag: response.ETag,
        attempts: attempt,
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`[R2_UPLOAD] ⚠️ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxAttempts) {
        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
      }
    }
  }

  console.error(`[R2_UPLOAD] ❌ All ${maxAttempts} attempts failed.`);
  throw lastError;
}
