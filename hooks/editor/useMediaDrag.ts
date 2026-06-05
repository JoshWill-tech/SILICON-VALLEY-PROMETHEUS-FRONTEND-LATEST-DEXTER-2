'use client';

import { useCallback } from 'react';

export const useMediaDrag = (onDropMedia: (data: any, time: number, trackId: string) => void) => {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, zoom: number, headerWidth: number, trackId: string) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/prometheus-media');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - headerWidth;
      const time = Math.max(0, x / zoom);
      
      onDropMedia(data, time, trackId);
    } catch (e) {
      console.error('Failed to drop media', e);
    }
  }, [onDropMedia]);

  return {
    handleDragOver,
    handleDrop
  };
};
