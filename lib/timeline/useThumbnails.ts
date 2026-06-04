import { useState, useEffect } from "react";

export function useThumbnails(videoId: string | null) {
  const [manifest, setManifest] = useState<{ time: number; url: string }[]>([]);
  const [cache] = useState(() => new Map<string, HTMLImageElement>());

  useEffect(() => {
    if (!videoId) return;
    fetch(`/api/thumbnails/${videoId}/manifest`)
      .then(r => r.json())
      .then(data => setManifest(data.frames || []))
      .catch(err => console.error("Failed to fetch thumbnails:", err));
  }, [videoId]);

  const getImage = (timeMs: number) => {
    if (!manifest.length) return null;
    const frame = manifest.find(f => f.time >= timeMs) || manifest[0];
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

  return { manifest, getImage };
}
