'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PrometheusLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullscreen?: boolean;
}

export function PrometheusLoader({ 
  size = 'md', 
  className, 
  fullscreen = false 
}: PrometheusLoaderProps) {
  
  const sizeMap = {
    sm: 'size-8',
    md: 'size-16',
    lg: 'size-24',
    xl: 'size-32',
  };

  const content = (
    <div className={cn("relative flex items-center justify-center", sizeMap[size], className)}>
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-cyan animate-spin duration-[3s]" />
      
      {/* Middle Ring */}
      <div className="absolute inset-[15%] rounded-full border-2 border-transparent border-b-accent-purple animate-reverse-spin duration-[2s]" />
      
      {/* Inner Ring / Pulse */}
      <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 animate-pulse-scale" />
      
      {/* Center Mark */}
      <div className="z-10 text-white font-bold text-[40%] select-none opacity-80">P</div>

      <style jsx>{`
        @keyframes reverse-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin linear infinite;
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-abyss">
        {content}
      </div>
    );
  }

  return content;
}
