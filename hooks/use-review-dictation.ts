'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useReviewDictation(onTranscript: (text: string) => void) {
  const [state, setState] = useState<'idle' | 'requesting' | 'recording' | 'transcribing'>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const request = useRef<AbortController | null>(null)
  const generation = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transcript = useRef(onTranscript)
  useEffect(() => { transcript.current = onTranscript }, [onTranscript])

  const cancel = useCallback(() => {
    generation.current++
    request.current?.abort()
    if (timer.current) clearTimeout(timer.current)
    const current = recorder.current
    if (current) {
      current.onstop = null
      current.ondataavailable = null
      current.onerror = null
      if (current.state !== 'inactive') current.stop()
    }
    recorder.current = null
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
  }, [])
  useEffect(() => cancel, [cancel])

  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  const start = useCallback(async () => {
    cancel()
    const run = generation.current
    setError(null)
    setState('requesting')
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Voice input is unavailable in this browser. You can still type a note.')
      const audio = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      if (generation.current !== run) { audio.getTracks().forEach(track => track.stop()); return }
      stream.current = audio
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type))
      const recording = new MediaRecorder(audio, mime ? { mimeType: mime } : undefined)
      recorder.current = recording
      recording.onerror = () => {
        if (generation.current !== run) return
        cancel()
        setError('Microphone recording stopped unexpectedly. Try again or type a note.')
        setState('idle')
      }
      const chunks: Blob[] = []
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recording.onstop = () => {
        if (timer.current) clearTimeout(timer.current)
        audio.getTracks().forEach(track => track.stop())
        if (generation.current !== run) return
        const controller = new AbortController()
        request.current = controller
        setState('transcribing')
        timer.current = setTimeout(() => controller.abort(), 90_000)
        void (async () => {
          try {
            const blob = new Blob(chunks, { type: recording.mimeType || 'audio/webm' })
            if (blob.size < 256) throw new Error('That recording was too short. Try again or type a note.')
            const form = new FormData()
            form.append('audio', blob, recording.mimeType.includes('mp4') ? 'review.m4a' : 'review.webm')
            let response = await fetch('/api/prometheus-chat/transcribe', { method: 'POST', body: form, signal: controller.signal })
            let payload = await response.json() as { text?: string; error?: string; status?: string; transcriptId?: string }
            if (!response.ok) throw new Error(payload.error || 'Could not transcribe this note.')
            for (let attempt = 0; payload.status === 'processing' && payload.transcriptId && attempt < 20; attempt++) {
              await new Promise<void>((resolve, reject) => {
                const abort = () => { clearTimeout(delay); reject(new Error('Voice input cancelled.')) }
                const delay = setTimeout(() => { controller.signal.removeEventListener('abort', abort); resolve() }, 1000)
                if (controller.signal.aborted) abort()
                else controller.signal.addEventListener('abort', abort, { once: true })
              })
              response = await fetch(`/api/prometheus-chat/transcribe?transcriptId=${encodeURIComponent(payload.transcriptId)}`, { signal: controller.signal })
              payload = await response.json()
              if (!response.ok) throw new Error(payload.error || 'Could not transcribe this note.')
            }
            if (!payload.text?.trim()) throw new Error('No speech was transcribed. Try again or type a note.')
            if (generation.current === run) transcript.current(payload.text.trim())
          } catch (cause) {
            if (generation.current === run) setError(cause instanceof Error && cause.name !== 'AbortError' ? cause.message : 'Transcription timed out. Try again or type a note.')
          } finally {
            if (generation.current === run) { if (timer.current) clearTimeout(timer.current); setState('idle') }
          }
        })()
      }
      recording.start()
      timer.current = setTimeout(stop, 60_000)
      setState('recording')
    } catch (cause) {
      if (generation.current === run) {
        cancel()
        setError(cause instanceof Error ? cause.message : 'Could not access the microphone. You can still type a note.')
        setState('idle')
      }
    }
  }, [cancel, stop])
  const clearError = useCallback(() => setError(null), [])
  return { state, error, start, stop, clearError }
}
