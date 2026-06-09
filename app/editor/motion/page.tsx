'use client'

import { useEffect } from 'react'

import { NodeGraphProvider } from './hooks/use-node-graph'
import { MotionCanvas } from './components/motion-canvas'

export default function MotionEditorPage() {
  useEffect(() => {
    const selectors = [
      '.editor-root > aside',
      'button[aria-label="Enter focus mode"]',
      'button[aria-label="Exit focus mode"]',
      'button[aria-label="Open command zone"]',
    ]
    const previousDisplays = new Map<HTMLElement, string>()
    const hideShellControls = () => {
      selectors
        .flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))
        .forEach((element) => {
          if (!previousDisplays.has(element)) {
            previousDisplays.set(element, element.style.display)
          }

          element.style.display = 'none'
        })
    }

    hideShellControls()
    const observer = new MutationObserver(hideShellControls)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      previousDisplays.forEach((display, element) => {
        element.style.display = display
      })
    }
  }, [])

  return (
    <NodeGraphProvider>
      <section className="fixed inset-0 z-[9999] bg-[#d4e8d4] p-0 text-white md:p-3">
        <div className="grid h-full place-items-center bg-[#d4e8d4] px-6 text-center md:hidden">
          <p className="max-w-[320px] text-sm font-medium leading-6 text-[#1d2b1d]">
            Motion Editor is optimized for desktop. Please use a larger screen.
          </p>
        </div>
        <div className="hidden h-full md:block">
          <MotionCanvas />
        </div>
      </section>
      <style jsx global>{`
        .editor-root > aside,
        .editor-root > button[aria-label='Enter focus mode'],
        .editor-root > button[aria-label='Exit focus mode'] {
          display: none !important;
        }

        .motion-status-dot {
          animation: motion-status-pulse 2s ease-in-out infinite;
        }

        .motion-audio-bar {
          animation: motion-audio-wave 0.86s ease-in-out infinite;
          height: 8px;
        }

        .motion-node-range {
          appearance: none;
          background: transparent;
          cursor: pointer;
          height: 18px;
        }

        .motion-node-range::-webkit-slider-runnable-track {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.72) 0%,
            rgba(255, 255, 255, 0.72) var(--range-fill, 50%),
            rgba(255, 255, 255, 0.11) var(--range-fill, 50%),
            rgba(255, 255, 255, 0.11) 100%
          );
          border-radius: 999px;
          height: 4px;
        }

        .motion-node-range::-webkit-slider-thumb {
          appearance: none;
          background: #fff;
          border: 0;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          height: 14px;
          margin-top: -5px;
          width: 14px;
        }

        .motion-node-range::-moz-range-track {
          background: rgba(255, 255, 255, 0.11);
          border-radius: 999px;
          height: 4px;
        }

        .motion-node-range::-moz-range-progress {
          background: rgba(255, 255, 255, 0.72);
          border-radius: 999px;
          height: 4px;
        }

        .motion-node-range::-moz-range-thumb {
          background: #fff;
          border: 0;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          height: 14px;
          width: 14px;
        }

        @keyframes motion-status-pulse {
          0%,
          100% {
            opacity: 0.62;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.45);
          }
        }

        @keyframes motion-audio-wave {
          0%,
          100% {
            height: 7px;
            opacity: 0.62;
          }
          45% {
            height: 20px;
            opacity: 1;
          }
        }
      `}</style>
    </NodeGraphProvider>
  )
}
