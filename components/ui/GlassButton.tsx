import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  variant = 'secondary', 
  size = 'md', 
  children, 
  className, 
  ...props 
}) => {
  const variants = {
    primary: 'border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan hover:bg-accent-cyan/10 shadow-[0_0_20px_rgba(0,240,255,0.15)]',
    secondary: 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white',
    ghost: 'border-transparent bg-transparent text-white/40 hover:text-white hover:bg-white/5'
  };

  const sizes = {
    sm: 'h-8 px-3 text-[10px]',
    md: 'h-10 px-4 text-xs',
    lg: 'h-12 px-6 text-sm'
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl border font-bold uppercase tracking-widest transition-all active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
