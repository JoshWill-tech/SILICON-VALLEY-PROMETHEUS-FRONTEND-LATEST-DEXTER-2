'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, X } from 'lucide-react';
import { useEditor } from './EditorContext';
import { cn } from '@/lib/utils';

export interface SegmentMarqueeProps {
  isSelecting: boolean;
  selectionStart: number | null;
  selectionEnd: number | null;
}

export const SegmentMarquee: React.FC<SegmentMarqueeProps> = ({ isSelecting, selectionStart, selectionEnd }) => {
  const { selection, clearSelection, saveSegment, isPlaying, setIsPlaying } = useEditor();
  const zoom = 10;
  const HEADER_WIDTH = 72;

  const activeSelection = isSelecting && selectionStart !== null && selectionEnd !== null
    ? {
        left: Math.min(selectionStart, selectionEnd) * zoom + HEADER_WIDTH,
        width: Math.abs(selectionEnd - selectionStart) * zoom
      }
    : selection
    ? {
        left: selection.startTime * zoom + HEADER_WIDTH,
        width: (selection.endTime - selection.startTime) * zoom
      }
    : null;

  if (!activeSelection) return null;

  return (
    <div 
      className="segment-marquee absolute top-0 h-full border-x-2 border-accent-blue bg-accent-blue/10 pointer-events-none z-20"
      style={{
        left: activeSelection.left,
        width: activeSelection.width,
        transition: isSelecting ? 'none' : 'all 0.2s ease-out'
      }}
    >
      {/* Handles */}
      <div className="absolute left-0 top-0 w-1.5 h-full bg-accent-blue cursor-ew-resize pointer-events-auto" />
      <div className="absolute right-0 top-0 w-1.5 h-full bg-accent-blue cursor-ew-resize pointer-events-auto" />
      
      {/* Floating Action Bar */}
      {!isSelecting && selection && (
        <motion.div 
          initial={{ opacity: 0, y: 10, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          className="absolute -top-14 left-1/2 flex items-center gap-2 p-1.5 glass-panel bg-void/80 backdrop-blur-xl border-accent-blue/30 rounded-xl pointer-events-auto shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
        >
          <button 
            onClick={() => saveSegment({
              id: `seg-${Date.now()}`,
              startTime: selection.startTime,
              endTime: selection.endTime,
              note: 'New iteration segment',
              priority: 'Medium'
            })}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-green hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="size-3" /> Save Segment
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent-cyan hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Play className="size-3 fill-current" /> Preview Loop
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button 
            onClick={clearSelection}
            className="p-1.5 text-white/40 hover:text-white transition-colors"
          >
            <X className="size-3" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
