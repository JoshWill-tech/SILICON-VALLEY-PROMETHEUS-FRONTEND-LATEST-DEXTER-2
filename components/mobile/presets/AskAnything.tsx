'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mic, Send } from 'lucide-react';
import { LiveOrb } from '@/components/3d/LiveOrb';
import { cn } from '@/lib/utils';

interface AskAnythingProps {
  onSearchToggle?: () => void;
  color?: 'green' | 'blue';
}

export function AskAnything({ onSearchToggle, color = 'green' }: AskAnythingProps) {
  const [isListening, setIsListening] = React.useState(false);
  const [value, setValue] = React.useState('');

  const toggleListen = () => {
    setIsListening(!isListening);
    if (!isListening && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const activeColorClass = color === 'green' ? "bg-green-500" : "bg-blue-500";

  return (
    <div className="flex h-full flex-col bg-[#050508] text-white overflow-hidden px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-12">
          <LiveOrb size={200} color={color} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-[32px] font-bold leading-tight mb-3">Ask Anything</h1>
          <p className="text-white/50 text-base max-w-[280px] mx-auto">
            An AI that listens, responds, and feels natural.
          </p>
        </motion.div>
      </div>

      <div className="mb-8">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ask me anything..."
              className={cn(
                "w-full h-[56px] bg-white/5 border border-white/10 rounded-2xl px-6 pr-14 text-base outline-none focus:ring-2 transition-all",
                color === 'green' ? "focus:ring-green-500/50" : "focus:ring-blue-500/50"
              )}
            />
            <button 
              onClick={toggleListen}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 size-10 flex items-center justify-center rounded-xl transition-all",
                isListening ? `${activeColorClass} text-white animate-pulse` : "bg-white/5 text-white/40"
              )}
            >
              <Mic className="size-5" />
            </button>
          </div>
          <button 
            disabled={!value.trim()}
            className={cn(
              "size-[56px] rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg disabled:opacity-50 active:scale-95 transition-all",
              color === 'green' ? "from-green-500 to-emerald-600" : "from-blue-500 to-indigo-600"
            )}
          >
            <Send className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
