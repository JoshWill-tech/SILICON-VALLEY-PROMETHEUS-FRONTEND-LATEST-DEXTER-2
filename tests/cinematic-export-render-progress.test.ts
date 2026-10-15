import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CinematicExportCluster } from '@/components/editor/cinematic-export-cluster'

test('CinematicExportCluster renders idle export button by default', () => {
  const html = renderToStaticMarkup(
    React.createElement(CinematicExportCluster, {
      onExport: () => {},
    })
  )
  assert.match(html, /Export/)
  assert.doesNotMatch(html, /progressbar/)
  assert.doesNotMatch(html, /%/)
})

test('CinematicExportCluster renders InlineLoadingAnimation and percentage when rendering', () => {
  const html = renderToStaticMarkup(
    React.createElement(CinematicExportCluster, {
      onExport: () => {},
      isRendering: true,
      progressPercent: 28,
    })
  )
  assert.match(html, /28%/)
  assert.match(html, /role="progressbar"/)
  assert.match(html, /aria-valuenow="28"/)
  assert.match(html, /aria-label="Export rendering at 28%"/)
})

test('CinematicExportCluster renders indeterminate rendering label when progressPercent is null', () => {
  const html = renderToStaticMarkup(
    React.createElement(CinematicExportCluster, {
      onExport: () => {},
      isRendering: true,
      progressPercent: null,
    })
  )
  assert.match(html, /Rendering/)
  assert.match(html, /role="progressbar"/)
})

test('CinematicExportCluster renders Download when completed', () => {
  const html = renderToStaticMarkup(
    React.createElement(CinematicExportCluster, {
      onExport: () => {},
      isCompleted: true,
      onDownload: () => {},
    })
  )
  assert.match(html, /Download/)
  assert.doesNotMatch(html, />Export</)
})

test('EditorHeader renders live percentage in command island when an export is rendering', async () => {
  const { EditorHeader } = await import('@/components/editor/EditorHeader')
  const html = renderToStaticMarkup(
    React.createElement(EditorHeader, {
      project: { id: 'proj-1', title: 'Test Project' } as any,
      job: null,
      saveStatus: 'saved',
      progressPercent: 0,
      isEditingTitle: false,
      tempTitle: 'Test Project',
      setTempTitle: () => {},
      titleInputRef: { current: null },
      activeWorkspaceTab: 'Editor' as any,
      isDeferredChromeReady: true,
      isExporting: false,
      isExportRendering: true,
      exportProgressPercent: 28,
      isDownloading: false,
      latestExport: null,
      hasSourceAsset: true,
      headerNavItems: [],
      onTitleSave: () => {},
      onTitleKeyDown: () => {},
      onTitleStartEdit: () => {},
      onWorkspaceTabChange: () => {},
      onPrepareExport: () => {},
      onDownload: () => {},
    })
  )
  assert.match(html, /28%/)
  assert.match(html, /role="progressbar"/)
  assert.match(html, /aria-valuenow="28"/)
})
