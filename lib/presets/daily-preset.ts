// lib/presets/daily-preset.ts
import { UserContext } from "@/types/user";

export const PRESETS = ['zus', 'alien', 'opera', 'logipsum'] as const;
export type PresetId = typeof PRESETS[number];

const STORAGE_KEY = 'prometheus:last-preset';
const PIN_KEY = 'prometheus:pinned-preset';
const SIDEBAR_STATE_KEY = 'prometheus:sidebar:collapsed';

interface PresetState {
  preset: PresetId;
  date: string; // "2026-06-06" in user's local time
}

export function getDailyPreset(): PresetId {
  if (typeof window === 'undefined') return PRESETS[0];

  const today = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" in local tz

  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const state: PresetState = JSON.parse(stored);
      if (state.date === today) return state.preset;
    } catch (e) {
      console.error('Failed to parse preset state', e);
    }
  }

  // New day — compute fresh
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PRESETS.length;
  const preset = PRESETS[index];

  // Persist
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, date: today }));
  return preset;
}

function isMorning(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 12;
}

export function getContextualPreset(user: UserContext): PresetId {
  if (user.isFirstVisit) return 'zus';
  if (user.activeProjects > 0) return 'alien';
  if (user.lastAction === 'paste-video') return 'logipsum';
  if (isMorning()) return 'opera';
  return getDailyPreset(); // hash fallback
}

export function getEffectivePreset(user: UserContext): PresetId {
  if (typeof window === 'undefined') return PRESETS[0];
  
  const pinned = localStorage.getItem(PIN_KEY);
  if (pinned && PRESETS.includes(pinned as PresetId)) {
    return pinned as PresetId;
  }
  return getContextualPreset(user);
}

export function pinPreset(preset: PresetId | null) {
  if (typeof window === 'undefined') return;
  if (preset) {
    localStorage.setItem(PIN_KEY, preset);
  } else {
    localStorage.removeItem(PIN_KEY);
  }
}

export function getPinnedPreset(): PresetId | null {
  if (typeof window === 'undefined') return null;
  const pinned = localStorage.getItem(PIN_KEY);
  return (pinned && PRESETS.includes(pinned as PresetId)) ? (pinned as PresetId) : null;
}

export function getSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIDEBAR_STATE_KEY) === 'true';
}

export function setSidebarCollapsed(collapsed: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsed));
}
