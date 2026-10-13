import type { SupabaseClient } from '@supabase/supabase-js'

export function personalMusicMimeType(filename: string, browserType: string) {
  const extension = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav',
    ogg: 'audio/ogg', flac: 'audio/flac', webm: 'audio/webm',
  }
  return types[extension ?? ''] || browserType.split(';')[0] || 'audio/mpeg'
}

export async function savePersonalMusicTrack(supabase: SupabaseClient, userId: string, file: File) {
  const storagePath = `${userId}/${crypto.randomUUID()}`
  const mimeType = personalMusicMimeType(file.name, file.type)
  const { error: storageError } = await supabase.storage.from('user-music')
    .upload(storagePath, file, { contentType: mimeType, upsert: false })
  if (storageError) throw storageError

  const fields = {
    user_id: userId, original_filename: file.name, storage_path: storagePath,
    mime_type: mimeType, size_bytes: file.size,
  }
  let result = await supabase.from('user_music_tracks').insert({
    ...fields, title: file.name.replace(/\.[^.]+$/, ''), folder_name: 'Unsorted',
  }).select('*').single()

  // The original table predates optional metadata. Keep uploads working on both schemas.
  if (result.error && ['PGRST204', '42703'].includes(result.error.code)
    && /\b(title|folder_name)\b/.test(result.error.message)) {
    result = await supabase.from('user_music_tracks').insert(fields).select('*').single()
  }
  if (result.error) {
    await supabase.storage.from('user-music').remove([storagePath])
    throw result.error
  }
  const { data: signed } = await supabase.storage.from('user-music').createSignedUrl(storagePath, 3600)
  return { track: result.data, previewUrl: signed?.signedUrl }
}
