'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ParallaxInputCardProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number;
}

export function ParallaxInputCard({ 
  children, 
  className,
  maxRotation = 10 
}: ParallaxInputCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxRotation, -maxRotation]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxRotation, maxRotation]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Mobile device orientation
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Gamma is left to right tilt in degrees [-90, 90]
      // Beta is front to back tilt in degrees [-180, 180]
      if (e.gamma !== null && e.beta !== null) {
        const xPct = Math.min(Math.max(e.gamma / 30, -0.5), 0.5);
        const yPct = Math.min(Math.max((e.beta - 45) / 30, -0.5), 0.5);
        x.set(xPct);
        y.set(yPct);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [x, y]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative parallax-card-container w-full transition-transform duration-100 ease-out",
        className
      )}
    >
      {/* Ambient Shadow (shifts opposite) */}
      <motion.div 
        style={{
          translateX: useTransform(mouseXSpring, [-0.5, 0.5], [10, -10]),
          translateY: useTransform(mouseYSpring, [-0.5, 0.5], [10, -10]),
          translateZ: -10,
        }}
        className="absolute inset-0 rounded-[32px] bg-black/40 blur-2xl -z-10 pointer-events-none"
      />

      {/* Main Glass Card */}
      <div className="auth-card auth-card-border overflow-hidden transform-gpu">
         {/* Inner Content with Z-index for pop-out effect */}
         <div style={{ transform: "translateZ(30px)" }} className="relative z-10">
            {children}
         </div>
         
         {/* Background Parallax Gradient */}
         <motion.div 
            style={{
              translateX: useTransform(mouseXSpring, [-0.5, 0.5], [-20, 20]),
              translateY: useTransform(mouseYSpring, [-0.5, 0.5], [-20, 20]),
              translateZ: 0,
            }}
            className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-accent-purple/5 pointer-events-none"
         />
      </div>
    </motion.div>
  );
}
