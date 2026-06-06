'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showIcon?: boolean;
}

export function LiquidButton({ children, showIcon = true, className, ...props }: LiquidButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Use requestAnimationFrame for smoothness if needed, but CSS variables are usually enough
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "liquid-button group px-8 py-3 rounded-full flex items-center justify-center gap-2 text-white font-semibold text-base border border-white/20 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {showIcon && (
        <ArrowUpRight className="size-4 relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      )}
      
      {/* Shadow Glow */}
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 blur-xl bg-inherit -z-10 transition-opacity duration-300" />
    </button>
  );
}
