'use client';

import * as React from 'react';
import { Settings2, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FocusModeToggle() {
  const [isFocusMode, setIsFocusMode] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('prometheus:focus-mode') === 'true';
    setIsFocusMode(saved);
    if (saved) {
      document.documentElement.classList.add('focus-mode');
    }
  }, []);

  const toggle = () => {
    const next = !isFocusMode;
    setIsFocusMode(next);
    localStorage.setItem('prometheus:focus-mode', String(next));
    if (next) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        isFocusMode 
          ? "bg-accent-cyan text-black" 
          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
      )}
      title={isFocusMode ? "Disable Focus Mode" : "Enable Focus Mode (Distraction-Free)"}
    >
      {isFocusMode ? <ZapOff className="size-3.5" /> : <Settings2 className="size-3.5" />}
      <span>{isFocusMode ? "Focus Active" : "Focus Mode"}</span>
    </button>
  );
}
