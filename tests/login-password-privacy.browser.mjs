import assert from 'node:assert/strict'
import { chromium, expect } from '@playwright/test'

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  headless: true,
  args: ['--no-sandbox'],
})
try {
  for (const theme of ['light', 'dark']) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, reducedMotion })
      await page.goto(`${process.env.TEST_BASE_URL || 'http://localhost:3000'}/login`)
      await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')
      if (theme === 'light') await page.getByRole('switch', { name: 'Dark mode' }).click()
      await expect(page.locator('html')).toHaveAttribute('data-color-mode', theme)
      const stage = page.locator('.auth-character-stage')
      await expect(stage).toBeVisible()
      const pupils = stage.locator('span.rounded-full')
      const transforms = () => pupils.evaluateAll(nodes => nodes.map(node => node.style.transform))
      const away = ['translate(-4px, -4px)', 'translate(-4px, -4px)', 'translate(-4px, -4px)', 'translate(-4px, -4px)', 'translate(-5px, -4px)', 'translate(-5px, -4px)', 'translate(-5px, -4px)', 'translate(-5px, -4px)']
      const assertAway = async () => expect.poll(transforms).toEqual(away)
      await page.getByLabel('Email', { exact: true }).fill('privacy@example.com')
      if (reducedMotion === 'no-preference') {
        await page.mouse.move(1350, 800)
        await expect.poll(async () => (await transforms()).every(value => Number(value.match(/translate\(([-.\d]+)/)?.[1]) > 0)).toBe(true)
      }
      // Visibility must take precedence even before a password has been entered.
      await page.getByRole('button', { name: 'Show password', exact: true }).click()
      await assertAway()
      await page.getByLabel('Password', { exact: true }).fill('Visible-test-password')
      await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
      await page.clock.install()
      for (let second = 0; second < 7; second++) {
        await page.mouse.move(second % 2 ? 20 : 1400, 100 + second * 100)
        await page.clock.runFor(1000)
        await assertAway()
      }
      // Clearing the field or moving focus must not release the privacy pose.
      await page.getByLabel('Password', { exact: true }).fill('')
      await page.getByLabel('Email', { exact: true }).focus()
      await assertAway()
      await page.getByRole('button', { name: 'Hide password', exact: true }).click()
      await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')
      await page.mouse.move(1400, 800)
      await page.clock.runFor(200)
      await expect.poll(async () => JSON.stringify(await transforms()) !== JSON.stringify(away)).toBe(true)
      if (reducedMotion === 'no-preference') {
        assert.ok((await transforms()).every(value => Number(value.match(/translate\(([-.\d]+)/)?.[1]) > 0), 'masked password restores cursor tracking')
      }
      console.log(`PASS: ${theme}, ${reducedMotion}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}
