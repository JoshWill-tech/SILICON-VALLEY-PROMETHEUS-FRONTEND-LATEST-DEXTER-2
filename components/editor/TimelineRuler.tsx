'use client';

import React from 'react';
import { useEditor } from './EditorContext';
import { cn } from '@/lib/utils';

export const TimelineRuler: React.FC = () => {
  const { duration } = useEditor();
  const zoom = 10; // pixels per second
  const HEADER_WIDTH = 72;

  return (
    <div 
      className="relative h-7 w-full border-b border-white/5 bg-void/50 select-none overflow-hidden"
      style={{ minWidth: (duration * zoom) + HEADER_WIDTH }}
    >
      <div className="absolute top-0 left-0 w-[72px] h-full bg-void z-10 border-r border-white/5" />
      
      <div className="flex absolute top-0 left-[72px] h-full items-end pb-1">
        {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => {
          const isMajor = i % 5 === 0;
          return (
            <div 
              key={i} 
              className="absolute flex flex-col items-center" 
              style={{ left: i * zoom }}
            >
              <div 
                className={cn(
                  "w-px bg-white/20",
                  isMajor ? "h-3 bg-white/40" : "h-1.5"
                )} 
              />
              {isMajor && (
                <span className="mt-0.5 font-mono text-[9px] text-white/40 font-bold uppercase tracking-tighter">
                  {i}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
