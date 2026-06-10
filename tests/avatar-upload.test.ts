import assert from 'node:assert/strict'

import {
  AVATAR_MAX_FILE_SIZE_BYTES,
  AVATAR_UPLOAD_ACCEPTED_TYPES,
  validateAvatarFile,
} from '@/lib/upload/avatar-upload'

function run() {
  const validFile = new File(['avatar'], 'avatar.png', {
    type: 'image/png',
  })

  assert.equal(AVATAR_MAX_FILE_SIZE_BYTES, 5_242_880)
  assert.deepEqual(AVATAR_UPLOAD_ACCEPTED_TYPES, ['image/jpeg', 'image/png', 'image/webp'])
  assert.doesNotThrow(() => validateAvatarFile(validFile))

  const invalidTypeFile = new File(['avatar'], 'avatar.gif', {
    type: 'image/gif',
  })
  assert.throws(() => validateAvatarFile(invalidTypeFile), /JPG, PNG, WebP/i)

  const tooLargeFile = {
    name: 'avatar.png',
    size: AVATAR_MAX_FILE_SIZE_BYTES + 1,
    type: 'image/png',
  } as File
  assert.throws(() => validateAvatarFile(tooLargeFile), /under 5MB/i)
}

run()
