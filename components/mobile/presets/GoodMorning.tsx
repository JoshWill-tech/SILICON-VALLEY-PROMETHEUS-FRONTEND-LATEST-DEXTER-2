'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mic, Search, Calendar, Video, Sparkles } from 'lucide-react';
import { LiveOrb } from '@/components/3d/LiveOrb';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  { title: "Birthday Surprises", subtitle: "Unique and fun ideas", icon: Sparkles, color: "orange" },
  { title: "Game Night", subtitle: "Affordable for 5 friends", icon: Calendar, color: "blue" },
  { title: "Video Script", subtitle: "Generate AI script", icon: Video, color: "purple" },
];

export function GoodMorning({ firstName = "Dexter" }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0a1628] to-[#050508] text-white overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="px-6 pt-8 mb-12">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
             <div className="size-full bg-gradient-to-br from-blue-500 to-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Good morning,</h1>
            <p className="text-white/60">{firstName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="px-6 mb-4 flex items-center justify-between">
           <span className="text-xs font-bold uppercase tracking-widest text-white/30">Suggestions</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto scroll-snap-x mandatory scrollbar-hidden px-6 pb-12">
           {SUGGESTIONS.map((s, i) => (
             <motion.div
               key={s.title}
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="shrink-0 w-[160px] h-[200px] rounded-[32px] bg-white/5 border border-white/10 p-6 flex flex-col justify-between scroll-snap-align-start active:scale-95 transition-transform"
             >
                <div className={cn("size-10 rounded-2xl flex items-center justify-center", `bg-${s.color}-500/20 text-${s.color}-400`)}>
                   <s.icon className="size-5" />
                </div>
                <div>
                   <h3 className="text-sm font-bold leading-tight mb-1">{s.title}</h3>
                   <p className="text-[10px] text-white/40">{s.subtitle}</p>
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-2 flex items-center gap-2">
           <div className="flex-1 pl-4 py-3 text-sm text-white/40 font-medium">
              Tap here to start work
           </div>
           <button className="size-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <Mic className="size-6" />
           </button>
        </div>
      </div>
    </div>
  );
}
