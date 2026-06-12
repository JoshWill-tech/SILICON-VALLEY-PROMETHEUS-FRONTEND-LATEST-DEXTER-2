export const nodeEntranceDelays: Record<string, number> = {
  'ai-config-1': 1,
  'prompt-1': 2,
  'image-settings-1': 3,
  'execute-1': 4,
  'final-results-1': 5,
}

export const edgeEntranceDelays: Record<string, number> = {
  e1: 2.35,
  e2: 3.35,
  e3: 4.35,
  e4: 4.35,
  e5: 5.35,
}

export function useAnimationSequence() {
  return {
    edgeEntranceDelays,
    nodeEntranceDelays,
  }
}
