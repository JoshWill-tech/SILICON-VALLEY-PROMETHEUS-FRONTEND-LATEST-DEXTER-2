'use client';

import * as React from 'react';
import { Drawer } from 'vaul';
import { Command } from 'cmdk';
import { Search, Zap, FolderKanban, LibraryBig, Settings, Wand2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileCommandPalette({ open, onOpenChange }: MobileCommandPaletteProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[101] flex h-[85vh] flex-col rounded-t-[32px] bg-[#0a0a0f] border-t border-white/10 outline-none">
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />
          
          <Command className="flex flex-1 flex-col overflow-hidden p-4">
            <div className="flex items-center gap-3 px-2 mb-4">
              <Search className="size-5 text-white/40" />
              <Command.Input 
                autoFocus
                placeholder="Search projects, assets, tools..." 
                className="flex-1 bg-transparent py-4 text-lg text-white placeholder-white/20 outline-none"
              />
              <button onClick={() => onOpenChange(false)} className="p-2 text-white/40 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <Command.List className="flex-1 overflow-y-auto scrollbar-hidden pb-8">
              <Command.Empty className="py-12 text-center text-white/40">
                No results found.
              </Command.Empty>

              <Command.Group heading="Quick Actions" className="px-2 mb-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 px-2">Quick Actions</div>
                <PaletteItem icon={Zap} label="New Project" shortcut="N" />
                <PaletteItem icon={Wand2} label="Open Editor" />
              </Command.Group>

              <Command.Group heading="Recent" className="px-2 mb-6">
                 <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 px-2">Recent</div>
                 <PaletteItem icon={FolderKanban} label="Social Video Pack" />
                 <PaletteItem icon={FolderKanban} label="Cinematic B-Roll" />
              </Command.Group>

              <Command.Group heading="Navigation" className="px-2">
                 <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 mb-3 px-2">Navigation</div>
                 <PaletteItem icon={LibraryBig} label="Asset Library" />
                 <PaletteItem icon={Settings} label="User Settings" />
              </Command.Group>
            </Command.List>
          </Command>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function PaletteItem({ icon: Icon, label, shortcut }: { icon: any, label: string, shortcut?: string }) {
  return (
    <Command.Item className="flex items-center gap-4 px-4 py-4 mb-1 rounded-2xl bg-white/5 border border-white/5 text-white/80 active:bg-white/10 active:scale-[0.98] transition-all aria-selected:bg-white/10 aria-selected:text-white">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
        <Icon className="size-5" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      {shortcut && (
        <span className="text-[10px] font-bold text-white/20 border border-white/10 px-2 py-1 rounded-lg">
          {shortcut}
        </span>
      )}
    </Command.Item>
  );
}
