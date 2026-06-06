// types/user.ts
export interface UserContext {
  id: string;
  firstName?: string;
  isFirstVisit: boolean;
  activeProjects: number;
  lastAction?: 'paste-video' | 'search' | 'create-project' | string;
}
