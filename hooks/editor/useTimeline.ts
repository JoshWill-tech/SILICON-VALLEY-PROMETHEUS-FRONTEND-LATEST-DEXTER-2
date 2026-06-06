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
  const [zoom, setZoom] = useState(10);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef(duration);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  const animate = useCallback(function animateFrame(time: number) {
    if (startTimeRef.current === null) {
      startTimeRef.current = time;
    }

    const deltaTime = (time - startTimeRef.current) / 1000;
    startTimeRef.current = time;

    const nextTime = currentTimeRef.current + deltaTime;

    if (nextTime >= durationRef.current) {
      setCurrentTime(durationRef.current);
      if (isPlayingRef.current) {
        setIsPlaying(false);
      }
      return; // Do NOT schedule next frame
    }

    setCurrentTime(nextTime);
    requestRef.current = requestAnimationFrame(animateFrame);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = null;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isPlaying, animate]);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, durationRef.current)));
  }, []);

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