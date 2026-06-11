export type DurableJobType = 
  | 'render' 
  | 'scene_detection' 
  | 'export' 
  | 'video_analysis' 
  | 'audio_processing' 
  | 'ai_enhancement'

export type DurableJobStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed'

export interface DurableJob {
  id: string
  userId: string
  projectId: string
  type: DurableJobType
  status: DurableJobStatus
  progress: number
  resultMetadata: Record<string, any>
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateJobRequest {
  projectId: string
  type: DurableJobType
  metadata?: Record<string, any>
}

export interface UpdateJobRequest {
  id: string
  status?: DurableJobStatus
  progress?: number
  metadata?: Record<string, any>
  errorMessage?: string
}
