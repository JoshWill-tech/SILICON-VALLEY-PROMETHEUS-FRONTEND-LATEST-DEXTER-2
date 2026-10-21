import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const profilePage = readFileSync('app/settings/profile/page.tsx', 'utf8')
const settingsPage = readFileSync('app/settings/page.tsx', 'utf8')

// Ensure Pronouns FieldRow is completely absent from the profile page template
assert.ok(
  !profilePage.includes('<FieldRow label="Pronouns"'),
  'app/settings/profile/page.tsx should not render the Pronouns FieldRow',
)

// Ensure SelectField for Pronouns is completely absent
assert.ok(
  !profilePage.includes('<SelectField\n                          label="Pronouns"') &&
  !profilePage.includes('label="Pronouns"'),
  'app/settings/profile/page.tsx should not contain Pronouns SelectField',
)

// Ensure Pronouns DetailRow is completely absent from the settings overview
assert.ok(
  !settingsPage.includes('<DetailRow label="Pronouns"'),
  'app/settings/page.tsx should not render the Pronouns DetailRow',
)

// Ensure Location is still rendered on both pages
assert.ok(
  profilePage.includes('<FieldRow label="Location"'),
  'app/settings/profile/page.tsx should still render the Location FieldRow',
)
assert.ok(
  settingsPage.includes('<DetailRow label="Location"'),
  'app/settings/page.tsx should still render the Location DetailRow',
)

console.log('all pronouns removal assertions passed')
