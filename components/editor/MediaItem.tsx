'use client';

import React from 'react';
import { Film, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaItemProps {
  id: string;
  name: string;
  duration: string;
  thumbnail?: string;
}

export const MediaItem: React.FC<MediaItemProps> = ({ name, duration, thumbnail }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/prometheus-media', JSON.stringify({ name, duration }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className="group relative flex flex-col gap-2 p-2 rounded-xl glass-panel bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-void flex items-center justify-center">
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
        ) : (
          <Film className="size-8 text-white/10 group-hover:text-white/30 transition-colors" />
        )}
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="size-10 rounded-full bg-accent-cyan/20 backdrop-blur-md border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Play className="size-5 fill-current ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
          <span className="font-mono text-[9px] font-bold text-white/80">{duration}</span>
        </div>
      </div>

      <div className="px-1">
        <h3 className="text-[11px] font-medium text-white/50 truncate group-hover:text-white/90 transition-colors">
          {name}
        </h3>
      </div>
    </div>
  );
};
