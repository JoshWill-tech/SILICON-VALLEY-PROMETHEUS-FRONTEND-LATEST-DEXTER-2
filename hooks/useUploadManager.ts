'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useEditor, type UploadTask } from '@/components/editor/EditorContext'

export function useUploadManager() {
  const { uploadTasks, addTask, updateTask, removeTask } = useEditor()
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((id) => clearInterval(id))
      intervalsRef.current.clear()
    }
  }, [])

  const simulateUpload = useCallback(
    (taskId: string) => {
      const existing = intervalsRef.current.get(taskId)
      if (existing) clearInterval(existing)

      const interval = setInterval(() => {
        const task = uploadTasks.find((t) => t.id === taskId)
        if (!task || task.status === 'complete' || task.status === 'error') {
          clearInterval(interval)
          intervalsRef.current.delete(taskId)
          return
        }

        const rand = Math.random()
        let networkState = task.networkState
        let progress = task.progress
        let status: UploadTask['status'] = task.status

        if (rand > 0.96) {
          networkState = 'offline'
          status = 'paused'
        } else if (rand > 0.88) {
          networkState = 'poor'
          progress += Math.random() * 1.5
        } else {
          networkState = 'good'
          progress += Math.random() * 7
        }

        if (progress >= 100) {
          progress = 100
          status = 'complete'
          clearInterval(interval)
          intervalsRef.current.delete(taskId)
        }

        updateTask(taskId, { progress, status, networkState })
      }, 300)

      intervalsRef.current.set(taskId, interval)
    },
    [uploadTasks, updateTask]
  )

  const startTask = useCallback(
    (filename: string, destination: string) => {
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const task = {
        id,
        filename,
        progress: 0,
        status: 'uploading' as const,
        destination,
        networkState: 'good' as const,
      }
      addTask(task)
      simulateUpload(id)
      return id
    },
    [addTask, simulateUpload]
  )

  const retryTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { status: 'uploading', progress: 0, networkState: 'good' })
      simulateUpload(taskId)
    },
    [updateTask, simulateUpload]
  )

  return { tasks: uploadTasks, addTask: startTask, retryTask, removeTask }
}
