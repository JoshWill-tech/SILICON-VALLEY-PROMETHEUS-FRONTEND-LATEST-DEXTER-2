'use client';

import { useState, useCallback, useEffect } from 'react';
import { SavedSegment } from '@/components/editor/EditorContext';

export const useIteration = (projectId: string) => {
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`prometheus-iterations-${projectId}`);
    if (stored) {
      try {
        setSavedSegments(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse iterations', e);
      }
    }
  }, [projectId]);

  // Persist to localStorage on change
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`prometheus-iterations-${projectId}`, JSON.stringify(savedSegments));
    }
  }, [savedSegments, projectId]);

  const addSegment = useCallback((segment: SavedSegment) => {
    setSavedSegments((prev) => [...prev, segment]);
  }, []);

  const removeSegment = useCallback((id: string) => {
    setSavedSegments((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSegment = useCallback((id: string, updates: Partial<SavedSegment>) => {
    setSavedSegments((prev) => 
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  return {
    savedSegments,
    addSegment,
    removeSegment,
    updateSegment,
    setSavedSegments
  };
};
