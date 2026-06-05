'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor } from './EditorContext';
import gsap from 'gsap';

export const Playhead: React.FC = () => {
  const { currentTime } = useEditor();
  const zoom = 10; // pixels per second
  const HEADER_WIDTH = 72;
  const playheadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playheadRef.current) {
      gsap.set(playheadRef.current, {
        x: HEADER_WIDTH + (currentTime * zoom)
      });
      gsap.fromTo(playheadRef.current,
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: "top", duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, []);

  useEffect(() => {
    if (playheadRef.current) {
      gsap.to(playheadRef.current, {
        x: HEADER_WIDTH + (currentTime * zoom),
        duration: 0.1,
        ease: 'none'
      });
    }
  }, [currentTime]);

  return (
    <div 
      ref={playheadRef}
      className="absolute top-0 left-0 w-0.5 h-full bg-accent-cyan z-30 pointer-events-none"
      style={{
        boxShadow: '0 0 15px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.2)'
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent-cyan rotate-45 -translate-y-1/2 rounded-sm shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
    </div>
  );
};
