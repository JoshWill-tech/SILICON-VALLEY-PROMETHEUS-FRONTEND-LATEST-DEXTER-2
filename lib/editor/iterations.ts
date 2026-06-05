import { SavedSegment } from '@/components/editor/EditorContext';

export interface IterationManifest {
  projectId: string;
  timestamp: string;
  segments: SavedSegment[];
}

/**
 * Builds an iteration manifest JSON from segments
 */
export function buildIterationManifest(projectId: string, segments: SavedSegment[]): IterationManifest {
  return {
    projectId,
    timestamp: new Date().toISOString(),
    segments
  };
}

/**
 * Serializes the manifest to a JSON string
 */
export function serializeManifest(manifest: IterationManifest): string {
  return JSON.stringify(manifest, null, 2);
}
