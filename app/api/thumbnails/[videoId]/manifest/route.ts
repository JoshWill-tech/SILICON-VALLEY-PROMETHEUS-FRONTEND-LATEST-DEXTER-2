import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ 
  region: "auto", 
  endpoint: process.env.R2_ENDPOINT, 
  credentials: { 
    accessKeyId: process.env.R2_ACCESS_KEY_ID!, 
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! 
  } 
});

export async function GET(request: NextRequest, { params }: any) {
  const videoId = (await params).videoId;
  try {
    const key = `thumbnails/${videoId}/manifest.json`;
    const response = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_SOURCES,
      Key: key,
    }));

    const manifestData = await response.Body?.transformToString();
    if (!manifestData) throw new Error("Empty manifest");

    return new NextResponse(manifestData, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Manifest Proxy Error]", error);
    return NextResponse.json({ error: "Manifest not found" }, { status: 404 });
  }
}
