import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8')

const editorHeader = read('components/editor/EditorHeader.tsx')
const masterReview = read('components/editor/MasterVideoReviewModal.tsx')
const dialogUi = read('components/ui/dialog.tsx')
const sheetUi = read('components/ui/sheet.tsx')
const slideDrawer = read('components/ui/slide-drawer.tsx')
const settingsPanel = read('components/editor/SettingsPanel.tsx')
const commandBubble = read('components/editor/CommandBubble.tsx')
const userProfilePopup = read('components/ui/user-profile-popup.tsx')
const thumbnailStyles = read('components/editor/thumbnail-studio/ThumbnailWorkspace.styles.ts')
const globalsCss = read('app/globals.css')
const tailwindConfig = read('tailwind.config.ts')

// 1. EditorHeader z-index is z-[100]
assert.match(editorHeader, /sticky\s+top-0\s+z-\[100\]/, 'EditorHeader must have sticky top-0 z-[100]')

// 2. MasterVideoReviewModal mounts via createPortal and has z-[500] (exceeding header z-100)
assert.match(masterReview, /createPortal/, 'MasterVideoReviewModal must use createPortal for document-level mounting')
assert.match(masterReview, /z-\[500\]/, 'MasterVideoReviewModal must use z-[500] so it cannot be occluded by header')
assert.doesNotMatch(masterReview, /fixed\s+inset-0\s+z-50/, 'MasterVideoReviewModal must not use z-50')

// 3. Systemic Dialog primitive elevation
assert.match(dialogUi, /DialogOverlay[\s\S]*?z-\[500\]/, 'DialogOverlay must use z-[500]')
assert.match(dialogUi, /DialogPrimitive\.Content[\s\S]*?z-\[500\]/, 'DialogPrimitive.Content must use z-[500]')
assert.doesNotMatch(dialogUi, /fixed\s+inset-0\s+z-50/, 'DialogOverlay must not use z-50')

// 4. Systemic Sheet primitive elevation
assert.match(sheetUi, /SheetOverlay[\s\S]*?z-\[500\]/, 'SheetOverlay must use z-[500]')
assert.match(sheetUi, /DialogPrimitive\.Content[\s\S]*?z-\[500\]/, 'Sheet Content must use z-[500]')
assert.doesNotMatch(sheetUi, /fixed\s+inset-0\s+z-50/, 'SheetOverlay must not use z-50')

// 5. SlideDrawer elevation
assert.match(slideDrawer, /z-\[500\]/, 'SlideDrawer backdrop must use z-[500]')
assert.match(slideDrawer, /z-\[501\]/, 'SlideDrawer content must use z-[501]')

// 6. SettingsPanel elevation and portaling
assert.match(settingsPanel, /createPortal/, 'SettingsPanel must use createPortal')
assert.match(settingsPanel, /z-\[500\]/, 'SettingsPanel must use z-[500]')

// 7. CommandBubble elevation
assert.match(commandBubble, /z-\[500\]/, 'CommandBubble must use z-[500]')

// 8. UserProfilePopup elevation
assert.match(userProfilePopup, /z-\[500\]/, 'UserProfilePopup backdrop must use z-[500]')
assert.match(userProfilePopup, /z-\[501\]/, 'UserProfilePopup menu must use z-[501]')

// 9. Thumbnail Studio elevation
assert.match(thumbnailStyles, /z-index:\s*500/, 'Thumbnail Studio must have z-index: 500')

// 10. Design tokens in globals.css and tailwind.config.ts
assert.match(globalsCss, /--z-modal:\s*500;/, 'globals.css must define --z-modal: 500')
assert.match(globalsCss, /--z-overlay:\s*500;/, 'globals.css must define --z-overlay: 500')
assert.match(tailwindConfig, /modal:\s*['"]var\(--z-modal\)['"]/, 'tailwind.config.ts must map modal token')

console.log('popup and modal z-index elevation checks passed')
