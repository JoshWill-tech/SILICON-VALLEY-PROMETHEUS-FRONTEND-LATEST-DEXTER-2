'use client'

import React from 'react'
import { motion } from 'framer-motion'

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-abyss">
      {/* Animated Orbs */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-accent-green/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-accent-cyan/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-[10%] left-[20%] h-[550px] w-[550px] rounded-full bg-accent-blue/20 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -120, 0],
            y: [0, -50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-[20%] right-[20%] h-[450px] w-[450px] rounded-full bg-accent-purple/20 blur-[120px]"
        />
      </div>

      {/* Grain Overlay */}
      <div 
        className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
