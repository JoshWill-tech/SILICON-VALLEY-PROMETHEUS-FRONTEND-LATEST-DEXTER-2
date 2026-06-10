import assert from 'node:assert/strict'

import {
  DEFAULT_FONT_ID,
  DEFAULT_THEME_ID,
  FONT_PRESETS,
  THEME_PRESETS,
  getFontPreset,
  getThemePreset,
  themeCssVariables,
} from '@/lib/theme/theme-tokens'

function run() {
  assert.equal(DEFAULT_THEME_ID, 'obsidian')
  assert.equal(DEFAULT_FONT_ID, 'inter')

  assert.equal(getThemePreset('ember')?.accent, '#F97316')
  assert.equal(getThemePreset('obsidian')?.background, '#0A0A0F')
  assert.equal(getFontPreset('geist')?.stack.includes('Geist'), true)

  assert.equal(THEME_PRESETS.length, 8)
  assert.equal(FONT_PRESETS.length, 6)

  const vars = themeCssVariables('glacier')
  assert.equal(vars['--theme-background'], '#0A1A1F')
  assert.equal(vars['--theme-foreground'], '#E8F4FD')
  assert.equal(vars['--theme-accent'], '#06B6D4')
}

run()
