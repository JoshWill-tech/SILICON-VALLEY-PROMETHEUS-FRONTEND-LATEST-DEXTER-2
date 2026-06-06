'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSidebarCollapsed, setSidebarCollapsed } from '@/lib/presets/daily-preset';

export function useSidebar() {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    setCollapsedState(getSidebarCollapsed());
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      setSidebarCollapsed(next);
      return next;
    });
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return { collapsed, toggle };
}
