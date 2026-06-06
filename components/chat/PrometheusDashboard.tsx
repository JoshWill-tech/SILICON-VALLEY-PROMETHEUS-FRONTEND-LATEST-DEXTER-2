'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Command as CommandIcon, Search } from 'lucide-react'
import { Command } from 'cmdk'
import { ZusPreset } from './presets/ZusPreset'
import { AlienPreset } from './presets/AlienPreset'
import { OperaPreset } from './presets/OperaPreset'
import { LogipsumPreset } from './presets/LogipsumPreset'
import { PresetId } from '@/lib/presets/daily-preset'
import { usePreset } from './PresetProvider'
import { UserContext } from '@/types/user'
import { MobileDashboard } from '../mobile/MobileDashboard'
import { FocusModeToggle } from '../ui/FocusModeToggle'

const MOCK_USER: UserContext = {
  id: 'user-123',
  firstName: 'Dexter',
  isFirstVisit: false,
  activeProjects: 2,
  lastAction: 'none'
}

export function PrometheusDashboard() {
  const { preset } = usePreset()
  const [open, setOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcut for Command Palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  if (!preset) return <div className="h-full w-full bg-[#05060a]" />
  if (isMobile) return <MobileDashboard />

  const renderPreset = () => {
    switch (preset) {
      case 'zus': return <ZusPreset />
      case 'alien': return <AlienPreset firstName={MOCK_USER.firstName} />
      case 'opera': return <OperaPreset />
      case 'logipsum': return <LogipsumPreset />
      default: return <ZusPreset />
    }
  }

  return (
    <div className="h-full w-full relative">
      {renderPreset()}

      {/* Persistent Command Zone (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <FocusModeToggle />
        <button
          onClick={() => setOpen(true)}
          className="size-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
        >
          <Zap className="size-6 fill-current" />
        </button>
      </div>

      {/* Command Palette */}
      <CommandDialog open={open} setOpen={setOpen} />
    </div>
  )
}

function CommandDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#0f1117] shadow-2xl"
          >
            <Command className="flex flex-col">
              <div className="flex items-center border-b border-white/5 px-4">
                <Search className="size-5 text-white/40" />
                <Command.Input 
                  placeholder="Type a command or search..." 
                  className="w-full bg-transparent py-4 pl-3 text-sm text-white placeholder-white/30 outline-none"
                />
              </div>
              
              <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hidden">
                <Command.Empty className="px-4 py-8 text-center text-sm text-white/40">No results found.</Command.Empty>
                
                <Command.Group heading="Suggestions" className="px-2 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">
                  <CommandItem icon={Zap} label="New Project" shortcut="N" />
                  <CommandItem icon={Search} label="Search Assets" shortcut="F" />
                </Command.Group>
                
                <Command.Group heading="Settings" className="px-2 py-3 text-xs font-semibold text-white/30 uppercase tracking-widest">
                  <CommandItem icon={CommandIcon} label="Shortcuts" />
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function CommandItem({ icon: Icon, label, shortcut }: { icon: any, label: string, shortcut?: string }) {
  return (
    <Command.Item className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 cursor-pointer transition-colors aria-selected:bg-white/5 aria-selected:text-white">
      <Icon className="size-4" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{shortcut}</span>}
    </Command.Item>
  )
}
