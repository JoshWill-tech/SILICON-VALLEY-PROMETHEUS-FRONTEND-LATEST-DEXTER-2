'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AudioLines } from 'lucide-react';
import { LiveOrb } from '@/components/3d/LiveOrb';
import { cn } from '@/lib/utils';

export function HelloRobin({ firstName = "Dexter" }) {
  return (
    <div className="flex h-full flex-col bg-black text-white overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative">
      <div className="flex-1 flex flex-col items-center justify-center relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%]">
            <LiveOrb size={140} color="orange" />
         </div>

         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="text-center mt-20"
         >
            <p className="text-lg text-white/60 mb-2 font-light">Hello {firstName}</p>
            <h1 className="text-[32px] font-bold leading-tight">How can I help you today?</h1>
         </motion.div>

         {/* Bottom Glow Reflection */}
         <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-500/20 to-transparent blur-[60px] pointer-events-none" />
      </div>

      <div className="px-6 mb-8 relative z-10">
        <div className="h-[64px] rounded-full bg-white/10 backdrop-blur-2xl border border-white/10 flex items-center px-6 gap-4">
           <div className="flex-1 text-base text-white/30">Ask anything...</div>
           <div className="flex items-end gap-1 h-5">
              {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                <motion.div 
                  key={i}
                  className="w-1 bg-blue-400 rounded-full"
                  animate={{ height: ['20%', '80%', '20%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
