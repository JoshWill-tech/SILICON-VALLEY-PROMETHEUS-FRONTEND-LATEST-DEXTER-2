'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  active?: boolean;
  className?: string;
  count?: number;
}

export function VoiceWaveform({ 
  active = false, 
  className,
  count = 24 
}: VoiceWaveformProps) {
  const bars = Array.from({ length: count });

  return (
    <div className={cn("flex items-end justify-center gap-[3px] h-10", className)}>
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-accent-cyan to-accent-purple"
          animate={active ? {
            height: [
              "20%",
              `${Math.random() * 60 + 40}%`,
              `${Math.random() * 40 + 20}%`,
              "20%"
            ],
          } : {
            height: "15%",
          }}
          transition={active ? {
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          } : {
            duration: 0.3,
          }}
        />
      ))}
    </div>
  );
}
