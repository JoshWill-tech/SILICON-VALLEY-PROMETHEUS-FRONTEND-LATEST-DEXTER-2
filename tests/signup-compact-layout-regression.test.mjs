import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const signupPage = read('app/(auth)/signup/page.tsx')
  const authShell = read('components/auth/AuthShell.tsx')
  const signupForm = read('components/auth/SignupForm.tsx')
  const socialButtons = read('components/auth/SocialAuthButtons.tsx')

  assert.match(signupPage, /compact/)
  assert.match(signupPage, /showSocialAuth=\{false\}/)
  assert.match(signupPage, /showLegalCopy=\{false\}/)

  assert.match(authShell, /compact\?: boolean/)
  assert.match(authShell, /showSocialAuth\?: boolean/)
  assert.match(authShell, /showLegalCopy\?: boolean/)
  assert.match(authShell, /auth-shell-panel-compact/)
  assert.match(authShell, /auth-shell-stack-compact/)

  assert.match(signupForm, /compact\?: boolean/)
  assert.match(signupForm, /auth-signup-form-compact/)
  assert.match(signupForm, /providers=\{\['google'\]\}/)
  assert.match(signupForm, /compact \? null :/)
  assert.match(signupForm, /deriveSignupName/)

  assert.match(socialButtons, /providers\?: SocialProvider\[\]/)
  assert.match(socialButtons, /enabledProviders/)
  assert.match(socialButtons, /provider === 'google'/)
  assert.equal(socialButtons.includes("provider === 'apple') console.log"), false)
  assert.equal(socialButtons.includes("provider === 'github') console.log"), false)
}

run()
