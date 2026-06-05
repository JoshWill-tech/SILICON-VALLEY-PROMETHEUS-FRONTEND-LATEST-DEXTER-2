'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useEditor } from './EditorContext';
import { SavedChip } from './SavedChip';

export const IterationRail: React.FC = () => {
  const { savedSegments } = useEditor();

  return (
    <div className="flex items-center gap-3 px-6 py-3 overflow-x-auto [scrollbar-width:none] h-14 bg-void border-b border-white/5">
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <Layers className="size-3 text-white/30" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
          Iterations
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <AnimatePresence mode="popLayout">
          {savedSegments.map((seg) => (
            <SavedChip key={seg.id} segment={seg} />
          ))}
        </AnimatePresence>
        
        {savedSegments.length === 0 && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] italic text-white/10 whitespace-nowrap"
          >
            No iterations saved. Shift+Drag to select ranges.
          </motion.span>
        )}
      </div>
    </div>
  );
};
