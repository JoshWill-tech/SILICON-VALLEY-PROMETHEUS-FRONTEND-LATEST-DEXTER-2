import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '.dark'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        abyss: '#0a0a0f',
        surface: '#111118',
        'surface-elevated': '#1a1a24',
        chrome: '#e8e8e8',
        'chrome-dim': '#6b6b78',
        'accent-cyan': '#00f0ff',
        'accent-blue': '#3b82f6',
        'accent-green': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-purple': '#a855f7',
        'track-video': '#3b82f6',
        'track-audio': '#10b981',
        'track-motion': '#a855f7',
        'track-text': '#f59e0b',
        'glass-bg': 'rgba(17, 17, 24, 0.55)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-highlight': 'rgba(255, 255, 255, 0.03)',
      }
    },
  },
  plugins: [],
}

export default config
