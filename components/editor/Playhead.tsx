'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor } from './EditorContext';
import gsap from 'gsap';
import { motion, useReducedMotion } from 'framer-motion';

interface PlayheadProps {
  position?: number;
  duration?: number;
  zoom?: number;
}

export const Playhead: React.FC<PlayheadProps> = (props) => {
  if (typeof props.position === 'number') {
    return <ControlledPlayhead position={props.position} zoom={props.zoom ?? 1} />;
  }

  return <ContextPlayhead />;
};

function ControlledPlayhead({ position, zoom }: { position: number; zoom: number }) {
  const shouldReduceMotion = useReducedMotion();
  const left = `${position * 10 * zoom}px`;

  return (
    <motion.div
      className="absolute top-0 z-20 h-full w-px bg-accent-cyan"
      style={{ left, boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }}
      animate={{ left }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'tween', ease: 'linear', duration: 0.1 }}
    >
      <div className="absolute -left-1.5 -top-1 h-3 w-3 rounded-full bg-accent-cyan shadow-glow-cyan" />
    </motion.div>
  );
}

function ContextPlayhead() {
  const { currentTime } = useEditor();
  const zoom = 10; // pixels per second
  const HEADER_WIDTH = 72;
  const playheadRef = useRef<HTMLDivElement>(null);
  const initialTimeRef = useRef(currentTime);

  useEffect(() => {
    if (playheadRef.current) {
      gsap.set(playheadRef.current, {
        x: HEADER_WIDTH + (initialTimeRef.current * zoom)
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
}
