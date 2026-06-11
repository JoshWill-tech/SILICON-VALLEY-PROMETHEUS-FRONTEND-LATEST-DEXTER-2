'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MediaBin } from './MediaBin';
import { PreviewViewport } from './PreviewViewport';
import { CinematicTimeline } from './CinematicTimeline';
import { MotionBrainCanvas } from './MotionBrainCanvas';
import { cn } from '@/lib/utils';
import { Menu, BrainCircuit } from 'lucide-react';

export interface EditorShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const EditorShell: React.FC<EditorShellProps> = ({ children, className, ...props }) => {
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(380);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);
  
  const shellRef = useRef<HTMLDivElement>(null);

  const onHandlePointerDown = useCallback((handler: (e: React.PointerEvent) => void) => (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const moveHandler = (moveEvent: PointerEvent) => {
      handler(moveEvent as unknown as React.PointerEvent);
    };

    const upHandler = () => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {}
    };

    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
  }, []);

  const handleLeftDrag = useCallback((e: React.PointerEvent) => {
    if (!shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    const newWidth = e.clientX - rect.left - 16; // 16 for gap/padding compensation
    setLeftWidth(Math.max(200, Math.min(400, newWidth)));
  }, []);

  const handleRightDrag = useCallback((e: React.PointerEvent) => {
    if (!shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    const newWidth = rect.right - e.clientX - 16; // 16 for gap/padding compensation
    setRightWidth(Math.max(300, Math.min(480, newWidth)));
  }, []);

  return (
    <div
      ref={shellRef}
      className={cn(
        "flex flex-col lg:flex-row w-full h-[100dvh] lg:h-[calc(100vh-56px)] bg-[var(--abyss)] lg:gap-3 lg:p-4 box-border overflow-hidden relative",
        className
      )}
      {...props}
    >
      {/* Mobile Header / Toggles */}
      <div className="flex lg:hidden flex-none items-center justify-between p-4 border-b border-white/5 bg-void z-20 relative">
        <button onClick={() => setMobileLeftOpen(true)} className="p-2 bg-white/5 rounded text-white hover:bg-white/10 transition-colors">
          <Menu className="size-4" />
        </button>
        <span className="font-bold text-xs tracking-widest text-white/80">PROMETHEUS</span>
        <button onClick={() => setMobileRightOpen(true)} className="p-2 bg-white/5 rounded text-white hover:bg-white/10 transition-colors">
          <BrainCircuit className="size-4" />
        </button>
      </div>

      {/* Overlays for Mobile Drawers */}
      {(mobileLeftOpen || mobileRightOpen) && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" 
          onClick={() => { setMobileLeftOpen(false); setMobileRightOpen(false); }} 
        />
      )}

      {/* Left Sidebar: Media Bin */}
      <aside 
        style={{ '--sidebar-width': `${leftWidth}px` } as React.CSSProperties}
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-[80vw] lg:w-[var(--sidebar-width)] flex flex-col h-full overflow-hidden",
          "bg-void/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-r border-white/5 lg:border-none",
          "transform transition-transform duration-300 ease-out lg:transform-none lg:transition-none",
          "-translate-x-full lg:translate-x-0",
          mobileLeftOpen && "translate-x-0"
        )}
      >
        <MediaBin />
        <div 
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize touch-none after:content-[''] after:absolute after:inset-y-0 after:-inset-x-5 after:bg-transparent hover:after:bg-white/5 z-10 transition-colors hidden lg:block"
          onPointerDown={(e) => onHandlePointerDown(handleLeftDrag)(e)}
        />
      </aside>

      {/* Center: Preview + Timeline */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 h-full overflow-hidden p-2 lg:p-0">
        <div className="flex-1 min-h-[40vh]">
          <PreviewViewport />
        </div>
        <div className="flex-none h-[240px] lg:h-[300px]">
          <CinematicTimeline />
        </div>
      </div>

      {/* Right: Motion Brain Canvas */}
      <aside 
        style={{ '--sidebar-width': `${rightWidth}px` } as React.CSSProperties}
        className={cn(
          "fixed lg:static inset-y-0 right-0 z-40 w-[80vw] lg:w-[var(--sidebar-width)] flex flex-col h-full overflow-hidden",
          "bg-void/95 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-l border-white/5 lg:border-none",
          "transform transition-transform duration-300 ease-out lg:transform-none lg:transition-none",
          "translate-x-full lg:translate-x-0",
          mobileRightOpen && "translate-x-0"
        )}
      >
        <div 
          className="absolute top-0 left-0 w-2 h-full cursor-col-resize touch-none after:content-[''] after:absolute after:inset-y-0 after:-inset-x-5 after:bg-transparent hover:after:bg-white/5 z-10 transition-colors hidden lg:block"
          onPointerDown={(e) => onHandlePointerDown(handleRightDrag)(e)}
        />
        <MotionBrainCanvas />
      </aside>

      {/* Overlays / Portals */}
      {children}
    </div>
  );
};
