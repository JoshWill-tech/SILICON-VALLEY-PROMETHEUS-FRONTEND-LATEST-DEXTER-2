'use client';

import { useState, useCallback, useRef } from 'react';
import { useDeviceTier } from './useDeviceTier';

export interface FFmpegThumbnail {
  time: number;
  url: string;
}

export function useFFmpeg() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tier = useDeviceTier();
  
  const workerRef = useRef<Worker | null>(null);

  const extractThumbnails = useCallback((videoUrl: string, interval: number = 5) => {
    return new Promise<FFmpegThumbnail[]>((resolve, reject) => {
      setIsProcessing(true);
      setError(null);

      if (workerRef.current) {
        workerRef.current.terminate();
      }

      const worker = new Worker(new URL('../lib/workers/ffmpeg-worker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, thumbnails, message } = e.data;

        if (type === 'complete') {
          const formatted = thumbnails.map((t: any) => ({
            time: t.time,
            url: URL.createObjectURL(new Blob([t.data], { type: 'image/webp' }))
          }));
          setIsProcessing(false);
          resolve(formatted);
          worker.terminate();
          workerRef.current = null;
        } else if (type === 'error') {
          setError(message);
          setIsProcessing(false);
          reject(new Error(message));
          worker.terminate();
          workerRef.current = null;
        }
      };

      worker.postMessage({ 
        type: 'extract-thumbnails', 
        videoUrl, 
        interval,
        deviceTier: tier
      });
    });
  }, [tier]);

  return { extractThumbnails, isProcessing, error };
}
