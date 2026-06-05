'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface TimelineState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  zoom: number;
}

export const useTimeline = (initialDuration = 60) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(10); // pixels per second

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback(function loop(time: number) {
    if (startTimeRef.current === null) {
      startTimeRef.current = time;
    }
    
    const deltaTime = (time - startTimeRef.current) / 1000;
    startTimeRef.current = time;

    setCurrentTime((prev) => {
      const next = prev + deltaTime;
      if (next >= duration) {
        setIsPlaying(false);
        return duration;
      }
      return next;
    });

    requestRef.current = requestAnimationFrame(loop);
  }, [duration]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return {
    currentTime,
    duration,
    isPlaying,
    zoom,
    setCurrentTime: seek,
    setDuration,
    setIsPlaying,
    setZoom,
    togglePlay,
    seek
  };
};
