'use client'

import { useCallback } from 'react'
import { useEditor, type UploadTask } from '@/components/editor/EditorContext'
import { uploadFileResumable } from '@/lib/upload/resumable-upload'

export function useUploadManager() {
  const { uploadTasks, addTask, updateTask, removeTask, projectId } = useEditor()

  const startTask = useCallback(
    async (file: File, destination: string) => {
      if (!projectId) {
        console.error('Cannot upload without a project ID');
        return;
      }

      const taskId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const task: UploadTask = {
        id: taskId,
        filename: file.name,
        progress: 0,
        status: 'uploading',
        destination,
        networkState: 'good',
      }
      addTask(task)

      try {
        const url = await uploadFileResumable(file, projectId, (progress) => {
          updateTask(taskId, { progress, status: 'uploading' })
        })
        updateTask(taskId, { progress: 100, status: 'complete' })
        return url
      } catch (error: any) {
        console.error('[UploadManagerError]', error)
        updateTask(taskId, { status: 'error' })
        throw error
      }
    },
    [addTask, updateTask, projectId]
  )

  const retryTask = useCallback(
    async (taskId: string, file: File, destination: string) => {
      // In a real app, you'd need the file object again to retry
      updateTask(taskId, { status: 'uploading', progress: 0, networkState: 'good' })
      return startTask(file, destination)
    },
    [updateTask, startTask]
  )

  return { tasks: uploadTasks, addTask: startTask, retryTask, removeTask }
}
