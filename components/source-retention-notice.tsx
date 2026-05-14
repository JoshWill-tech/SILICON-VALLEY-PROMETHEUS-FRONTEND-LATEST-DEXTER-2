'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SourceRetentionNotice({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm transition-all duration-300", className)}>
      <div 
        className="flex cursor-pointer items-start gap-3 sm:items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-0.5 shrink-0 rounded-full bg-blue-500/10 p-1.5 sm:mt-0">
          <Info className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div className="flex-1 text-xs leading-relaxed text-white/60">
          <span className="text-white/80">Source videos are kept for 15 days</span> to manage storage. Edited outputs stay in your project folder unless you delete them.
        </div>
        <div className="shrink-0 p-1 text-white/40 hover:text-white/80">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-white/5 pt-3 text-xs leading-relaxed text-white/50">
              We keep original source uploads temporarily so Prometheus can process, revise, and regenerate previews. After 15 days, source videos may be removed to manage storage. Your edited outputs and exports remain available in your project folder unless you choose to delete them.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
