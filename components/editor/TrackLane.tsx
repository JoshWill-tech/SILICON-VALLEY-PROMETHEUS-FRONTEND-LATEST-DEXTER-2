'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrackLaneProps {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  children?: React.ReactNode;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ label, icon: Icon, color, children }) => {
  return (
    <div className="relative flex items-center h-[52px] border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
      {/* Sticky Header */}
      <div className="sticky left-0 z-20 flex items-center gap-2.5 w-[72px] h-full px-3 bg-void border-r border-white/5 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
        <Icon className="size-3.5" style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
          {label.charAt(0)}
        </span>
      </div>

      {/* Clip Area */}
      <div className="relative flex-1 h-full min-w-0">
        {children}
      </div>
    </div>
  );
};
