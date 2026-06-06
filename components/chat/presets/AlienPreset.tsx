// components/chat/presets/AlienPreset.tsx
'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Video, Plus } from 'lucide-react'
import { ChatInput } from '../ChatInput'
import { cn } from '@/lib/utils'

const TABS = ["Agency", "Team", "Personal", "Marketing", "Leads"]
const TEMPLATES = [
  { title: "Align my calendar with this week's tasks", icon: Calendar },
  { title: "Create meeting highlight", icon: Video },
]

export function AlienPreset({ firstName = "User" }) {
  const [activeTab, setActiveTab] = React.useState("Personal")

  return (
    <div className="flex flex-col h-full bg-[#0f1117] text-white overflow-hidden relative">
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="flex-1 flex flex-col px-8 pt-12 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-medium">Hello, {firstName}</h1>
          <p className="text-white/60">How I can help you?</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all relative",
                activeTab === tab ? "text-white" : "bg-white/5 text-white/40 hover:text-white/60"
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full -z-10"
                />
              )}
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-8">
           <div className="relative mb-6">
              <h2 className="text-xl font-medium relative z-10">Templates</h2>
              <div className="absolute -top-1 left-0 w-24 h-[2px] bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 animate-shimmer" />
           </div>
           
           <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
           >
              {TEMPLATES.map((t) => (
                <motion.div
                  key={t.title}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <t.icon className="size-6 mb-4 text-white/60" />
                  <p className="text-sm">{t.title}</p>
                </motion.div>
              ))}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="border-2 border-dashed border-white/20 rounded-xl p-6 flex items-center justify-center hover:border-white/40 transition-colors cursor-pointer"
              >
                <Plus className="size-6 text-white/40" />
              </motion.div>
           </motion.div>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
         <ChatInput variant="alien" />
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
