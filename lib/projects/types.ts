export type ProjectCardStatus = 'draft' | 'rendering' | 'completed' | 'failed'

export interface ProjectListItem {
  id: string
  userId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  status: ProjectCardStatus
  progress: number | null
  createdAt: string
  updatedAt: string
  duration: number | null
  width: number | null
  height: number | null
  fps: number | null
}

export interface CreateProjectInput {
  title: string
  description?: string | null
  template?: string | null
}
