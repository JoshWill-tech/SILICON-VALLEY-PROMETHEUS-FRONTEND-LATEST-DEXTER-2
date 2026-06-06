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
        'accent-cyan': 'var(--accent-cyan, #22d3ee)',
        'accent-blue': 'var(--accent-blue, #3b82f6)',
        'accent-green': 'var(--accent-green, #10b981)',
        'accent-emerald': 'var(--accent-emerald, #10b981)',
        'accent-orange': 'var(--accent-orange, #f97316)',
        'accent-indigo': 'var(--accent-indigo, #6366f1)',
        'accent-purple': 'var(--accent-purple, #a855f7)',
        'accent-amber': 'var(--accent-amber, #f59e0b)',
        'glass-bg': 'var(--glass-bg, rgba(255, 255, 255, 0.03))',
        'glass-border': 'var(--glass-border, rgba(255, 255, 255, 0.08))',
        'glass-highlight': 'var(--glass-highlight, rgba(255, 255, 255, 0.03))',
        'bg-deep': 'var(--bg-deep, #0a0a0f)',
      },
      backdropBlur: {
        'glass': '40px',
      },
      borderRadius: {
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}

export default config
