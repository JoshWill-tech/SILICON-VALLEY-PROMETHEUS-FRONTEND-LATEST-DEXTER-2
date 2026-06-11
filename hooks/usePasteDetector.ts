"use client";

import { useEffect } from "react";

import { useContextualFlags } from "./useContextualFlags";

const VIDEO_EXTS = /\.(mp4|mov|avi|mkv|webm|m4v|flv)$/i;
const VIDEO_HOSTS = /(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|twitter\.com|x\.com)/i;

export function usePasteDetector() {
  const { flagPastedVideo } = useContextualFlags();

  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text") || "";
      const files = event.clipboardData?.files;
      const isVideoUrl = VIDEO_HOSTS.test(text) || VIDEO_EXTS.test(text);
      const hasVideoFile = files ? Array.from(files).some((file) => file.type.startsWith("video/")) : false;

      if (isVideoUrl || hasVideoFile) {
        flagPastedVideo();
      }
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [flagPastedVideo]);
}
