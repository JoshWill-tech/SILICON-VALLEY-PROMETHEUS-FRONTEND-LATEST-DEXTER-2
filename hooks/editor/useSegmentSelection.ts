'use client';

import { useState, useCallback } from 'react';

export interface SelectionRange {
  startTime: number;
  endTime: number;
  startX: number;
  endX: number;
}

export const useSegmentSelection = () => {
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
  }, []);

  const updateSelection = useCallback((range: SelectionRange) => {
    setSelection(range);
  }, []);

  return {
    selection,
    isSelecting,
    setSelection: updateSelection,
    setIsSelecting,
    clearSelection
  };
};
