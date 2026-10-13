import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { personalMusicMimeType, savePersonalMusicTrack } from '../lib/personal-music-upload'

async function run() {
  const file = new File(['audio'], 'Black Magic.mp3', { type: 'audio/mp3' })
  assert.equal(personalMusicMimeType(file.name, file.type), 'audio/mpeg')
  assert.equal(personalMusicMimeType('song.FLAC', 'application/octet-stream'), 'audio/flac')
  assert.equal(personalMusicMimeType('song.m4a', ''), 'audio/mp4')

  function mock(errors: Array<null | { code: string; message: string }>, storageError: unknown = null) {
    const inserts: Record<string, unknown>[] = []
    const removed: string[][] = []
    const uploads: Array<{ path: string; contentType: string }> = []
    const client = {
      storage: { from: (bucket: string) => {
        assert.equal(bucket, 'user-music')
        return {
          upload: async (path: string, data: File, options: { contentType: string }) => {
            assert.equal(data, file)
            uploads.push({ path, contentType: options.contentType })
            return { error: storageError }
          },
          remove: async (paths: string[]) => { removed.push(paths); return { error: null } },
          createSignedUrl: async () => ({ data: { signedUrl: 'https://example.com/private-preview' } }),
        }
      } },
      from: (table: string) => {
        assert.equal(table, 'user_music_tracks')
        return { insert: (fields: Record<string, unknown>) => {
          inserts.push(fields)
          return { select: (columns: string) => {
            assert.equal(columns, '*')
            return { single: async () => ({ data: { id: 'saved-id', ...fields }, error: errors.shift() ?? null }) }
          } }
        } }
      },
    } as unknown as SupabaseClient
    return { client, inserts, removed, uploads }
  }

  const modern = mock([null])
  const saved = await savePersonalMusicTrack(modern.client, 'owner', file)
  assert.equal(saved.track.id, 'saved-id')
  assert.equal(saved.previewUrl, 'https://example.com/private-preview')
  assert.equal(modern.inserts.length, 1)
  assert.equal(modern.inserts[0].title, 'Black Magic')
  assert.match(modern.uploads[0].path, /^owner\//)
  assert.equal(modern.uploads[0].contentType, 'audio/mpeg')

  for (const code of ['PGRST204', '42703']) {
    const legacy = mock([{ code, message: "Could not find the 'title' column of 'user_music_tracks'" }, null])
    const result = await savePersonalMusicTrack(legacy.client, 'owner', file)
    assert.equal(result.track.id, 'saved-id')
    assert.equal(legacy.inserts.length, 2)
    assert.ok(!('title' in legacy.inserts[1]))
    assert.ok(!('folder_name' in legacy.inserts[1]))
    assert.equal(legacy.uploads.length, 1, 'Compatibility retry must reuse the uploaded object')
    assert.equal(legacy.removed.length, 0)
  }

  const denied = mock([{ code: '42501', message: 'permission denied' }])
  await assert.rejects(savePersonalMusicTrack(denied.client, 'owner', file), { message: 'permission denied' })
  assert.equal(denied.inserts.length, 1, 'Permission errors must not trigger a compatibility retry')
  assert.deepEqual(denied.removed, [[denied.uploads[0].path]], 'Failed metadata saves clean up the audio object')

  const storageFailure = mock([], { message: 'Storage unavailable' })
  await assert.rejects(savePersonalMusicTrack(storageFailure.client, 'owner', file), { message: 'Storage unavailable' })
  assert.equal(storageFailure.inserts.length, 0)
  console.log('personal music upload tests passed')
}
void run()
