import React from 'react';
import { cn } from '@/lib/utils';

export interface TimecodeDisplayProps {
  seconds: number;
  showFrames?: boolean;
  fps?: number;
  className?: string;
}

export const TimecodeDisplay: React.FC<TimecodeDisplayProps> = ({ 
  seconds, 
  showFrames = false, 
  fps = 30,
  className 
}) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);

  const parts = [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].filter(Boolean);

  let formatted = parts.join(':');
  if (showFrames) {
    formatted += `.${frames.toString().padStart(2, '0')}`;
  }

  return (
    <span className={cn("font-mono font-bold tracking-tighter", className)}>
      {formatted}
    </span>
  );
};
