'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface MotionNodeProps {
  id: string;
  title: string;
  icon: LucideIcon;
  active?: boolean;
  x: number;
  y: number;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const MotionNode: React.FC<MotionNodeProps> = ({ 
  title, 
  icon: Icon, 
  active, 
  x, 
  y, 
  children,
  onClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute p-4 rounded-2xl glass-panel bg-void/60 border-white/10 w-48 transition-all duration-300 cursor-pointer select-none",
        active ? "border-accent-cyan shadow-[0_0_30px_rgba(0,240,255,0.2)] scale-[1.02]" : "hover:border-white/20"
      )}
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "size-8 rounded-lg flex items-center justify-center transition-colors",
          active ? "bg-accent-cyan/20 text-accent-cyan" : "bg-white/5 text-white/40"
        )}>
          <Icon className="size-4" />
        </div>
        <span className={cn(
          "text-[11px] font-bold uppercase tracking-widest",
          active ? "text-white" : "text-white/40"
        )}>
          {title}
        </span>
      </div>

      <div className="space-y-2">
        {children || (
          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-2/3 bg-accent-cyan/40" />
          </div>
        )}
      </div>

      {/* Port Handles */}
      <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-3 rounded-full bg-void border-2 border-white/20 hover:border-accent-cyan transition-colors" />
      <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-3 rounded-full bg-void border-2 border-white/20 hover:border-accent-cyan transition-colors" />
    </motion.div>
  );
};
