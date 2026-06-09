export interface R2Track {
  id: string
  title: string
  artist: string
  genre: string
  duration: number
  url: string
  thumbnail?: string | null
}

type MusicLibraryR2Response = {
  tracks?: R2Track[]
  error?: string
}

export async function fetchR2Tracks(): Promise<R2Track[]> {
  const response = await fetch('/api/music/library?source=r2', {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch R2 tracks')
  }

  const payload = (await response.json()) as MusicLibraryR2Response | R2Track[]
  if (Array.isArray(payload)) return payload
  if (payload.error) throw new Error(payload.error)
  return payload.tracks ?? []
}
