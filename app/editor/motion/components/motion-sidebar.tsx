'use client'

import { Briefcase, FileText, Home, LogOut, Search, Settings, Workflow } from 'lucide-react'
import { motion } from 'framer-motion'

const topItems = [
  { label: 'Home', icon: Home },
  { label: 'Motion', icon: Workflow, active: true },
  { label: 'Projects', icon: Briefcase },
  { label: 'Search', icon: Search },
  { label: 'Pages', icon: FileText },
  { label: 'Settings', icon: Settings },
]

export function MotionSidebar() {
  return (
    <motion.aside
      className="absolute bottom-0 left-0 top-14 z-30 flex w-14 flex-col items-center justify-between bg-white/[0.032] py-4"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.42 }}
    >
      <nav className="flex flex-col items-center gap-4" aria-label="Motion editor">
        {topItems.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.button
              aria-label={item.label}
              className={item.active
                ? 'grid size-10 place-items-center rounded-xl bg-[#22c55e] text-white shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                : 'grid size-10 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.055] hover:text-white'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + index * 0.08, duration: 0.28 }}
              key={item.label}
              type="button"
            >
              <Icon className="size-5" aria-hidden />
            </motion.button>
          )
        })}
      </nav>
      <button aria-label="Logout" className="grid size-10 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.055] hover:text-white" type="button">
        <LogOut className="size-5" aria-hidden />
      </button>
    </motion.aside>
  )
}
