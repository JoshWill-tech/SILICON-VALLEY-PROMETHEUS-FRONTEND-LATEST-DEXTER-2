'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TrackClipProps {
  id: string;
  label: string;
  start: number;
  end: number;
  color: string;
}

export const TrackClip: React.FC<TrackClipProps> = ({ label, start, end, color }) => {
  const zoom = 10; // pixels per second
  const left = start * zoom;
  const width = (end - start) * zoom;

  return (
    <div 
      className="absolute top-1/2 -translate-y-1/2 h-9 rounded-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center px-3 cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:-translate-y-[calc(50%+2px)] transition-all group overflow-hidden"
      style={{ 
        left, 
        width,
        background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
        borderColor: `${color}44`
      }}
    >
      {/* Glow Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
        style={{ backgroundColor: color }}
      />

      <span className="text-[10px] font-bold text-white/60 truncate group-hover:text-white transition-colors select-none">
        {label}
      </span>

      {/* Resize Handles */}
      <div className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-white/20 transition-colors" />
      <div className="absolute right-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-white/20 transition-colors" />
    </div>
  );
};
