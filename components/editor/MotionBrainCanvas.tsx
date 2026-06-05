'use client'

import React, { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { 
  Zap, 
  BrainCircuit, 
  Settings2, 
  Sparkles, 
  Play, 
  Activity,
  Cpu,
  Layers,
  Wand2,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NodeProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  active?: boolean
  className?: string
}

const Node: React.FC<NodeProps> = ({ title, icon: Icon, children, active, className }) => (
  <div className={cn("motion-node", active && "active", className)}>
    <div className="flex items-center gap-2 mb-3">
      <div className={cn(
        "p-1.5 rounded-lg bg-white/5 border border-white/10",
        active && "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5"
      )}>
        <Icon className="size-3.5" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{title}</span>
    </div>
    {children}
  </div>
)

export const MotionBrainCanvas: React.FC = () => {
  const isProcessing = true // Mock state

  useEffect(() => {
    // GSAP node processing animations
    gsap.fromTo(".connection-line", 
      { strokeDashoffset: 200 },
      { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut", stagger: 0.2, repeat: -1 }
    )

    gsap.to(".node-brain", {
      boxShadow: "0 0 30px rgba(0,240,255,0.4)",
      duration: 1.5, 
      repeat: -1, 
      yoyo: true, 
      ease: "sine.inOut"
    })
  }, [])

  return (
    <div className="node-canvas h-full flex flex-col items-center">
      {/* Background SVG Connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--accent-green)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {/* Connection Paths */}
        <path 
          d="M 140 100 L 140 700" 
          stroke="url(#lineGrad)" 
          strokeWidth="2" 
          fill="none" 
          strokeDasharray="8 4"
          className="connection-line"
          style={{ transform: 'translateX(calc(50% - 140px))' }}
        />
      </svg>

      <div className="w-full max-w-[320px] py-8 space-y-12">
        {/* Input Node */}
        <Node title="Prompt Input" icon={Zap} active>
          <div className="glass-panel p-3 bg-void/50 border-white/5">
            <p className="text-[11px] leading-relaxed text-white/70 italic">
              &quot;Create a cinematic pan with anamorphic flares and high-contrast color grading. Match the beat at 0:42.&quot;
            </p>
          </div>
        </Node>

        {/* AI Config Node */}
        <div className="flex gap-4">
          <Node title="AI Engine" icon={Cpu} className="flex-1">
             <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/30">Model</span>
                  <span className="text-accent-cyan">Claude 3.5</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/30">Latency</span>
                  <span className="text-accent-green">140ms</span>
                </div>
             </div>
          </Node>
          
          <Node title="Settings" icon={Settings2} className="flex-1">
             <div className="space-y-2">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-accent-amber" />
                </div>
                <span className="text-[9px] text-white/30 uppercase">Creativity: 75%</span>
             </div>
          </Node>
        </div>

        {/* Brain Node (Process) */}
        <div className="relative flex justify-center py-4">
          <div className={cn(
            "node-brain size-20 rounded-2xl glass-panel flex items-center justify-center bg-void/80 border-white/10 z-10",
            isProcessing && "border-accent-cyan/40"
          )}>
            <div className={cn(
              "size-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center",
              isProcessing && "animate-pulse"
            )}>
              <BrainCircuit className="size-6 text-accent-cyan" />
            </div>
            {isProcessing && (
               <div className="absolute -inset-4 border border-accent-cyan/10 rounded-full animate-[ping_3s_linear_infinite]" />
            )}
          </div>
          <span className="absolute -bottom-2 text-[9px] font-bold uppercase tracking-[0.3em] text-accent-cyan animate-pulse">Processing</span>
        </div>

        {/* Final Result Node */}
        <Node title="Final Result" icon={Sparkles}>
          <div className="relative aspect-video rounded-lg border border-white/10 overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
              alt="Result"
              className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="size-3 fill-current ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 backdrop-blur-sm">
               <div className="size-1.5 rounded-full bg-accent-green" />
               <span className="text-[8px] font-bold uppercase">Ready</span>
            </div>
          </div>
        </Node>
      </div>

      {/* Bottom Analyze Button */}
      <div className="mt-auto w-full pt-8 pb-4">
        <button className="w-full flex items-center justify-between px-5 py-4 rounded-2xl glass-panel bg-accent-green/5 border-accent-green/20 hover:bg-accent-green/10 transition-all group">
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-xl bg-accent-green/20 flex items-center justify-center">
                <Activity className="size-4 text-accent-green" />
             </div>
             <div className="text-left">
                <div className="text-[11px] font-bold uppercase tracking-widest text-white">Analyze Iterations</div>
                <div className="text-[9px] text-white/30 uppercase font-medium">Manifest Ready</div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-accent-green font-mono text-xs font-bold">(2)</span>
             <ChevronRight className="size-4 text-white/20 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  )
}
