'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { cn } from '@/lib/utils';

interface LiveOrbProps {
  size?: number;
  className?: string;
  color?: 'purple' | 'green' | 'blue' | 'orange';
}

export function LiveOrb({ size = 180, className, color = 'purple' }: LiveOrbProps) {
  const tier = useDeviceTier();
  const ref = React.useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const sx = useSpring(pointerX, { stiffness: 100, damping: 20 });
  const sy = useSpring(pointerY, { stiffness: 100, damping: 20 });

  const tiltX = useTransform(sy, [-1, 1], [15, -15]);
  const tiltY = useTransform(sx, [-1, 1], [-15, 15]);

  const colorConfig = {
    purple: { primary: 'rgba(168,85,247,0.6)', secondary: 'rgba(126,34,206,0.4)', glow: 'rgba(168,85,247,0.3)' },
    green: { primary: 'rgba(34,197,94,0.6)', secondary: 'rgba(21,128,61,0.4)', glow: 'rgba(34,197,94,0.3)' },
    blue: { primary: 'rgba(59,130,246,0.6)', secondary: 'rgba(29,78,216,0.4)', glow: 'rgba(59,130,246,0.3)' },
    orange: { primary: 'rgba(249,115,22,0.6)', secondary: 'rgba(194,65,12,0.4)', glow: 'rgba(249,115,22,0.3)' },
  }[color];

  const handlePointerMove = (e: React.PointerEvent) => {
    if (tier === 'lite') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    pointerX.set(x * 2);
    pointerY.set(y * 2);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  if (tier === 'lite') {
    return (
      <div 
        className={cn("rounded-full", className)}
        style={{ 
          width: size, 
          height: size, 
          background: `radial-gradient(circle, ${colorConfig.primary} 0%, ${colorConfig.secondary} 70%, transparent 100%)`,
          boxShadow: `0 0 30px ${colorConfig.glow}`
        }}
      />
    );
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size, perspective: 1000 }}
    >
      {/* Background Glow */}
      <motion.div
        className="absolute inset-[-20%] rounded-full opacity-50"
        style={{
          background: `radial-gradient(circle, ${colorConfig.primary} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main Sphere */}
      <motion.div
        className="relative w-full h-full rounded-full border border-white/20 overflow-hidden"
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, ${colorConfig.primary} 30%, ${colorConfig.secondary} 70%, #000 100%)`,
          boxShadow: 'inset -10px -10px 30px rgba(0,0,0,0.5), inset 10px 10px 30px rgba(255,255,255,0.2)',
        }}
        animate={tier === 'premium' ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Shine/Highlight */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[30%] bg-white/40 rounded-full blur-xl" />
        
        {/* Animated Gradient Layers (Premium Only) */}
        {tier === 'premium' && (
          <motion.div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent, ${colorConfig.primary}, transparent)`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>

      {/* Outer Ring (Standard & Premium) */}
      <motion.div
        className="absolute inset-[-10%] rounded-full border border-white/10"
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
