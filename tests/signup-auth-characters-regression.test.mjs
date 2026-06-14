import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function run() {
  const interactionPath = 'components/auth/auth-interaction.tsx'
  const charactersPath = 'components/auth/animated-auth-characters.tsx'

  assert.equal(existsSync(join(root, interactionPath)), true)
  assert.equal(existsSync(join(root, charactersPath)), true)

  const interaction = read(interactionPath)
  assert.match(interaction, /AuthInteractionProvider/)
  assert.match(interaction, /setPasswordSignal/)
  assert.match(interaction, /activeField/)

  const characters = read(charactersPath)
  assert.match(characters, /PrometheusAuthCharacters/)
  assert.match(characters, /isPurplePeeking/)
  assert.match(characters, /isLookingAtEachOther/)
  assert.match(characters, /forceLookX/)
  assert.match(characters, /useReducedMotion/)
  assert.match(characters, /auth-character-stage/)

  const shell = read('components/auth/AuthShell.tsx')
  assert.match(shell, /AuthInteractionProvider/)
  assert.match(shell, /PrometheusAuthCharacters/)
  assert.match(shell, /FloatingPaths/)
  assert.match(shell, /SocialAuthButtons/)
  assert.match(shell, /children/)
  assert.equal(shell.includes('DOM Click Target'), false)

  const signupForm = read('components/auth/SignupForm.tsx')
  assert.match(signupForm, /useAuthInteraction/)
  assert.match(signupForm, /setPasswordSignal/)
  assert.match(signupForm, /showPassword/)
  assert.match(signupForm, /EyeIcon/)
  assert.match(signupForm, /EyeOffIcon/)
  assert.match(signupForm, /fetch\('\/api\/auth\/signup'/)
  assert.match(signupForm, /Turnstile/)
  assert.match(signupForm, /captchaToken/)
}

run()
