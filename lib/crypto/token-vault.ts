// server-only
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";
import crypto from "crypto";

// Initialize client, but don't validate ARN at top level to avoid startup crashes
const kmsClient = new KMSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "missing",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "missing",
  },
});

export interface SealedToken {
  ciphertext: string;
  iv: string;
  keyVersion: string;
}

function getKmsKeyArn() {
  const arn = process.env.KMS_KEY_ARN;
  if (!arn) {
    throw new Error("KMS_KEY_ARN is not configured in environment variables.");
  }
  return arn;
}

export async function sealToken(plaintext: string): Promise<SealedToken> {
  const keyArn = getKmsKeyArn();
  
  // Use Node.js crypto for IV generation (Surgical Fix for P0)
  const iv = crypto.randomBytes(12);
  
  const command = new EncryptCommand({
    KeyId: keyArn,
    Plaintext: new TextEncoder().encode(plaintext),
    EncryptionContext: { purpose: "oauth-token", app: "prometheus" },
  });

  try {
    const response = await kmsClient.send(command);
    if (!response.CiphertextBlob) throw new Error("KMS encryption failed: No CiphertextBlob returned");

    return {
      ciphertext: Buffer.from(response.CiphertextBlob).toString("base64"),
      iv: iv.toString("base64"),
      keyVersion: response.KeyId?.split("/").pop() || "1",
    };
  } catch (error) {
    console.error("[KMS_SEAL_ERROR]", error);
    throw error;
  }
}

export async function unsealToken(sealed: SealedToken): Promise<string> {
  const keyArn = getKmsKeyArn();
  
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(sealed.ciphertext, "base64"),
    KeyId: keyArn,
    EncryptionContext: { purpose: "oauth-token", app: "prometheus" },
  });

  try {
    const response = await kmsClient.send(command);
    if (!response.Plaintext) throw new Error("KMS decryption failed: No Plaintext returned");

    return new TextDecoder().decode(response.Plaintext);
  } catch (error) {
    console.error("[KMS_UNSEAL_ERROR]", error);
    throw error;
  }
}

export function burnToken(token: string | null): void {
  if (token) {
    // In-memory zeroing attempt (best effort for Node.js)
    const buf = Buffer.from(token);
    buf.fill(0);
  }
}
