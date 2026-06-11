'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEditor, SavedSegment } from './EditorContext';
import { cn } from '@/lib/utils';

export interface SavedChipProps {
  segment: SavedSegment;
}

export const SavedChip: React.FC<SavedChipProps> = ({ segment }) => {
  const { setCurrentTime, removeSavedSegment } = useEditor();

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="saved-chip group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent-green/30 bg-accent-green/5 hover:bg-accent-green/10 cursor-pointer transition-colors whitespace-nowrap"
      onClick={() => setCurrentTime(segment.startTime)}
    >
      <div className="size-1.5 rounded-full bg-accent-green shadow-[0_0_8px_var(--accent-green)]" />
      <span className="font-mono text-[10px] font-bold text-white/70">
        {formatTime(segment.startTime)}–{formatTime(segment.endTime)}
      </span>
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          removeSavedSegment(segment.id); 
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white p-0.5"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  );
};
