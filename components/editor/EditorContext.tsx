'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'

export interface TimelineSelection {
  startTime: number
  endTime: number
  startX: number
  endX: number
}

export interface VideoSegment {
  id: string
  startTime: number
  endTime: number
  label: string
  aiGenerated: boolean
}

export interface UploadTask {
  id: string
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'paused' | 'complete' | 'error'
  destination: string
  networkState: 'good' | 'poor' | 'offline'
}

export interface AIPrompt {
  id: string
  segmentId: string
  prompt: string
  status: 'pending' | 'processing' | 'complete'
  result?: string
}

interface EditorState {
  projectId: string | null
  currentTime: number
  duration: number
  isPlaying: boolean
  selection: TimelineSelection | null
  segments: VideoSegment[]
  prompts: AIPrompt[]
  showExport: boolean
  showCommandBubble: boolean
  uploadTasks: UploadTask[]
  currentVideoUrl: string | null
}

type EditorAction =
  | { type: 'SET_TIME'; payload: number }
  | { type: 'TOGGLE_PLAY'; payload: boolean }
  | { type: 'SET_SELECTION'; payload: TimelineSelection | null }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_EXPORT'; payload: boolean }
  | { type: 'TOGGLE_COMMAND'; payload: boolean }
  | { type: 'ADD_PROMPT'; payload: AIPrompt }
  | { type: 'UPDATE_PROMPT'; payload: { id: string; status: AIPrompt['status']; result?: string } }
  | { type: 'ADD_TASK'; payload: UploadTask }
  | { type: 'UPDATE_TASK'; payload: { id: string; progress?: number; status?: UploadTask['status']; networkState?: UploadTask['networkState'] } }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'SET_VIDEO_URL'; payload: string | null }

const initialState: EditorState = {
  projectId: null,
  currentTime: 0,
  duration: 180,
  isPlaying: false,
  selection: null,
  segments: [
    { id: 'seg-1', startTime: 0, endTime: 30, label: 'Intro', aiGenerated: true },
    { id: 'seg-2', startTime: 30, endTime: 60, label: 'Scene 1', aiGenerated: true },
    { id: 'seg-3', startTime: 60, endTime: 90, label: 'Transition', aiGenerated: true },
    { id: 'seg-4', startTime: 90, endTime: 120, label: 'Scene 2', aiGenerated: true },
    { id: 'seg-5', startTime: 120, endTime: 150, label: 'Climax', aiGenerated: true },
    { id: 'seg-6', startTime: 150, endTime: 180, label: 'Outro', aiGenerated: true },
  ],
  prompts: [],
  showExport: false,
  showCommandBubble: false,
  uploadTasks: [],
  currentVideoUrl: null,
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TIME':
      return { ...state, currentTime: Math.max(0, Math.min(action.payload, state.duration)) }
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: action.payload }
    case 'SET_SELECTION':
      return { ...state, selection: action.payload, showCommandBubble: !!action.payload }
    case 'CLEAR_SELECTION':
      return { ...state, selection: null, showCommandBubble: false }
    case 'TOGGLE_EXPORT':
      return { ...state, showExport: action.payload }
    case 'TOGGLE_COMMAND':
      return { ...state, showCommandBubble: action.payload }
    case 'ADD_PROMPT':
      return { ...state, prompts: [...state.prompts, action.payload] }
    case 'UPDATE_PROMPT':
      return {
        ...state,
        prompts: state.prompts.map((p) =>
          p.id === action.payload.id ? { ...p, status: action.payload.status, result: action.payload.result } : p
        ),
      }
    case 'ADD_TASK':
      return { ...state, uploadTasks: [...state.uploadTasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        uploadTasks: state.uploadTasks.map((t) =>
          t.id === action.payload.id
            ? { ...t, progress: action.payload.progress ?? t.progress, status: action.payload.status ?? t.status, networkState: action.payload.networkState ?? t.networkState }
            : t
        ),
      }
    case 'REMOVE_TASK':
      return { ...state, uploadTasks: state.uploadTasks.filter((t) => t.id !== action.payload) }
    case 'SET_VIDEO_URL':
      return { ...state, currentVideoUrl: action.payload }
    default:
      return state
  }
}

interface EditorContextValue extends EditorState {
  setCurrentTime: (t: number) => void
  setIsPlaying: (p: boolean) => void
  setSelection: (s: TimelineSelection | null) => void
  clearSelection: () => void
  setShowExport: (s: boolean) => void
  setShowCommandBubble: (s: boolean) => void
  addPrompt: (segmentId: string, promptText: string) => void
  addTask: (task: UploadTask) => void
  updateTask: (id: string, updates: Partial<Omit<UploadTask, 'id'>>) => void
  removeTask: (id: string) => void
  setCurrentVideoUrl: (url: string | null) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  const setCurrentTime = useCallback((t: number) => dispatch({ type: 'SET_TIME', payload: t }), [])
  const setIsPlaying = useCallback((p: boolean) => dispatch({ type: 'TOGGLE_PLAY', payload: p }), [])
  const setSelection = useCallback((s: TimelineSelection | null) => dispatch({ type: 'SET_SELECTION', payload: s }), [])
  const clearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), [])
  const setShowExport = useCallback((s: boolean) => dispatch({ type: 'TOGGLE_EXPORT', payload: s }), [])
  const setShowCommandBubble = useCallback((s: boolean) => dispatch({ type: 'TOGGLE_COMMAND', payload: s }), [])
  const setCurrentVideoUrl = useCallback((url: string | null) => dispatch({ type: 'SET_VIDEO_URL', payload: url }), [])

  const addPrompt = useCallback((segmentId: string, promptText: string) => {
    const newPrompt: AIPrompt = {
      id: `prompt-${Date.now()}`,
      segmentId,
      prompt: promptText,
      status: 'pending',
    }
    dispatch({ type: 'ADD_PROMPT', payload: newPrompt })

    setTimeout(() => {
      dispatch({ type: 'UPDATE_PROMPT', payload: { id: newPrompt.id, status: 'processing' } })
    }, 600)

    setTimeout(() => {
      dispatch({
        type: 'UPDATE_PROMPT',
        payload: { id: newPrompt.id, status: 'complete', result: 'Segment restyled per instruction.' },
      })
    }, 3200)
  }, [])

  const addTask = useCallback((task: UploadTask) => dispatch({ type: 'ADD_TASK', payload: task }), [])
  const updateTask = useCallback((id: string, updates: Partial<Omit<UploadTask, 'id'>>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, ...updates } })
  }, [])
  const removeTask = useCallback((id: string) => dispatch({ type: 'REMOVE_TASK', payload: id }), [])

  return (
    <EditorContext.Provider
      value={{
        ...state,
        setCurrentTime,
        setIsPlaying,
        setSelection,
        clearSelection,
        setShowExport,
        setShowCommandBubble,
        addPrompt,
        addTask,
        updateTask,
        removeTask,
        setCurrentVideoUrl,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
