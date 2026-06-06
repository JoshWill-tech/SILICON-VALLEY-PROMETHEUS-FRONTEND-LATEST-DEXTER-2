'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { usePreset } from '@/components/chat/PresetProvider';
import { AskAnything } from './presets/AskAnything';
import { GoodMorning } from './presets/GoodMorning';
import { HelloRobin } from './presets/HelloRobin';
import { MobileCommandPalette } from './MobileCommandPalette';

export function MobileDashboard() {
  const { preset } = usePreset();
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  if (!preset) return <div className="h-full w-full bg-[#050508]" />;

  const renderPreset = () => {
    switch (preset) {
      case 'zus':
        return <AskAnything color="green" onSearchToggle={() => setPaletteOpen(true)} />;
      case 'logipsum':
        return <AskAnything color="blue" onSearchToggle={() => setPaletteOpen(true)} />;
      case 'alien':
        return <GoodMorning firstName="Dexter" />;
      case 'opera':
        return <HelloRobin firstName="Dexter" />;
      default:
        return <AskAnything color="green" onSearchToggle={() => setPaletteOpen(true)} />;
    }
  };

  return (
    <div className="h-full w-full bg-[#050508] relative">
      {renderPreset()}

      {/* Persistent Floating Search Pill */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      >
        <button 
          onClick={() => setPaletteOpen(true)}
          className="h-10 px-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center gap-2 text-white/40 text-sm font-medium shadow-2xl active:scale-95 transition-all"
        >
          <Search className="size-4" />
          <span>Search Prometheus...</span>
        </button>
      </motion.div>

      <MobileCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
