'use client';

import { useState, useEffect } from "react";
import { useFFmpeg } from "@/hooks/useFFmpeg";
import { useEditor } from "@/components/editor/EditorContext";

export function useThumbnails(projectId: string | null) {
  const { currentVideoUrl } = useEditor();
  const { extractThumbnails, isProcessing } = useFFmpeg();
  const [manifest, setManifest] = useState<{ time: number; url: string }[]>([]);
  const [cache] = useState(() => new Map<string, HTMLImageElement>());

  useEffect(() => {
    if (!currentVideoUrl) {
      if (projectId) {
        // Fallback to server manifest if no local video URL
        fetch(`/api/thumbnails/${projectId}/manifest`)
          .then(r => r.json())
          .then(data => setManifest(data.frames || []))
          .catch(err => console.error("Failed to fetch thumbnails:", err));
      }
      return;
    }

    // Use client-side FFmpeg.wasm if local video is available
    let active = true;
    extractThumbnails(currentVideoUrl, 5)
      .then(thumbs => {
        if (active) {
          setManifest(thumbs);
        }
      })
      .catch(err => console.error("FFmpeg thumbnail extraction failed:", err));

    return () => { active = false; };
  }, [currentVideoUrl, projectId, extractThumbnails]);

  const getImage = (timeMs: number) => {
    if (!manifest.length) return null;
    
    // Find closest frame
    const frame = manifest.find(f => f.time >= timeMs) || manifest[manifest.length - 1];
    if (!frame) return null;
    
    if (cache.has(frame.url)) {
      const cached = cache.get(frame.url)!;
      return cached.complete ? cached : null;
    }
    
    const img = new Image();
    img.src = frame.url;
    cache.set(frame.url, img);
    return null;
  };

  return { manifest, getImage, isProcessing };
}
