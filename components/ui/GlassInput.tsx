import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

export const GlassInput: React.FC<GlassInputProps> = ({ icon: Icon, className, ...props }) => {
  return (
    <div className="relative w-full group">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-cyan transition-colors">
          <Icon className="size-4" />
        </div>
      )}
      <input
        className={cn(
          "w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/20 outline-none transition-all",
          "focus:border-accent-cyan focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] focus:bg-black/40",
          Icon && "pl-11",
          className
        )}
        {...props}
      />
    </div>
  );
};
