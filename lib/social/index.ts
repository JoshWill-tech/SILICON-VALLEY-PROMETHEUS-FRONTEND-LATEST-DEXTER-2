import { postToTikTok } from "./tiktok";
import { uploadToYouTube } from "./youtube";
import { postToInstagram } from "./instagram";
import { postToX } from "./x";
import { postToFacebook } from "./facebook";
import { postToLinkedIn } from "./linkedin";
import { postToDropbox } from "./dropbox";
import { saveToDrive } from "./google-drive";
import { OAuthProvider } from "@/lib/oauth/types";

export async function distributeContent(
  userId: string, 
  provider: OAuthProvider, 
  videoUrl: string, 
  caption: string, 
  extraMetadata: any = {}
) {
  switch (provider) {
    case "tiktok":
      return postToTikTok(userId, videoUrl, caption);
    case "youtube":
      return uploadToYouTube(userId, videoUrl, { 
        title: extraMetadata.title || caption, 
        description: extraMetadata.description || "", 
        tags: extraMetadata.tags || [] 
      });
    case "instagram":
      return postToInstagram(userId, videoUrl, caption);
    case "x":
      return postToX(userId, videoUrl, caption);
    case "facebook":
      return postToFacebook(userId, videoUrl, caption);
    case "linkedin":
      return postToLinkedIn(userId, videoUrl, caption);
    case "dropbox":
      return postToDropbox(userId, videoUrl, extraMetadata.fileName || `export-${Date.now()}.mp4`);
    case "google_drive":
      return saveToDrive(userId, videoUrl, extraMetadata.fileName || `export-${Date.now()}.mp4`);
    default:
      throw new Error(`Provider ${provider} not supported for automated distribution yet.`);
  }
}

export * from './types'
