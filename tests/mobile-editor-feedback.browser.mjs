import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, expect } from '@playwright/test'

// Local fixture only, with a disposable browser profile. Start
// `node scripts/mobile-editor-proof.mjs` first; no live account or paid render.
const artifacts = resolve('artifacts/mobile-editor-proof')
await mkdir(artifacts, {recursive:true})
const browser = await chromium.launch({channel:'msedge',headless:true})
const errors=[]
const results=[]
try {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true})
  const page=await context.newPage()
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto('http://127.0.0.1:4183')
  const tab=label=>page.getByRole('navigation',{name:'Editor workspaces'}).getByRole('button',{name:label,exact:true})
  await expect(tab('Editorial')).toHaveAttribute('aria-pressed','true')
  await expect(page.getByLabel('Editorial instruction')).toBeVisible()
  await expect(page.locator('video')).toHaveCount(1)
  const previewCompare=page.getByRole('button',{name:'Compare original and rendered video',exact:true})
  await expect(previewCompare).toBeVisible()
  await previewCompare.tap()
  const previewDialog=page.getByRole('dialog',{name:'Compare original and rendered video',exact:true})
  await expect(previewDialog).toBeVisible()
  await expect(previewDialog.getByRole('button',{name:'Move Rendered frame annotation',exact:true})).toBeVisible()
  await previewDialog.getByRole('button',{name:'Close comparison',exact:true}).tap()
  await expect(previewDialog).toBeHidden()
  await tab('Motion').tap()
  await expect(tab('Motion')).toHaveAttribute('aria-pressed','true')
  await expect(page.getByRole('region',{name:'Source screening'})).toHaveCount(0)
  await expect(page.locator('video')).toHaveCount(1)
  await expect.poll(()=>page.locator('video').evaluate(element=>element.readyState),{timeout:30000}).toBeGreaterThanOrEqual(2)
  const motionBounds=await page.locator('[data-motion-property-canvas]').boundingBox()
  assert.ok(motionBounds.y<200&&motionBounds.height>500,'Motion fills its tab instead of collapsing into a bottom sheet')
  await page.screenshot({path:resolve(artifacts,'motion-phone.png')})
  await tab('Export').tap()
  await expect(page.getByRole('heading',{name:'Feedback & corrections'})).toBeVisible()
  const video=page.getByLabel('Finished MP4',{exact:true})
  await expect.poll(()=>video.evaluate(element=>element.readyState),{timeout:30000}).toBeGreaterThanOrEqual(2)
  const moveBtn=page.getByRole('button',{name:'Move Rendered frame annotation',exact:true})
  await expect(moveBtn).toBeVisible()
  const collapseBtn=page.getByRole('button',{name:'Collapse Rendered frame annotation',exact:true})
  await expect(collapseBtn).toBeVisible()
  await collapseBtn.tap()
  const expandBtn=page.getByRole('button',{name:'Expand Rendered frame annotation',exact:true})
  await expect(expandBtn).toBeVisible()
  await expandBtn.tap()
  await expect(moveBtn).toBeVisible()
  const pillBefore=await page.locator('[data-review-placement="floating"]').last().boundingBox()
  await moveBtn.focus()
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  const pillAfter=await page.locator('[data-review-placement="floating"]').last().boundingBox()
  assert.ok(pillAfter.y<pillBefore.y,'Arrow keys nudge the review pill upward on mobile')
  const input=page.getByRole('textbox',{name:'Rendered frame note',exact:true})
  await input.fill('Move the caption above the speaker')
  await page.getByRole('button',{name:'Save rendered frame note',exact:true}).tap()
  await expect(input).toHaveValue('')
  await expect(page.getByRole('button',{name:'Review notes 1',exact:true})).toBeVisible()

  const pending=page.waitForEvent('download')
  await page.getByRole('button',{name:'JSON',exact:true}).tap()
  const download=await pending
  const jsonPath=resolve(artifacts,'render-corrections.json')
  await download.saveAs(jsonPath)
  const review=JSON.parse(await readFile(jsonPath,'utf8'))
  assert.equal(review.entries.length,1)
  assert.equal(review.entries[0].source,'rendered')
  assert.equal(review.entries[0].renderId,'mobile-proof-render')
  assert.deepEqual(review.entries[0].notes,['Move the caption above the speaker'])
  assert.match(review.entries[0].image,/^data:image\/png;base64,/)
  await page.getByRole('button',{name:'Draw on rendered frame',exact:true}).scrollIntoViewIfNeeded()
  await page.screenshot({path:resolve(artifacts,'render-corrections-phone.png')})

  await page.reload()
  await tab('Export').tap()
  await expect(page.getByRole('button',{name:'Review notes 1',exact:true})).toBeVisible()
  await expect.poll(()=>video.evaluate(element=>element.readyState),{timeout:30000}).toBeGreaterThanOrEqual(2)
  await page.getByRole('button',{name:'Draw on rendered frame',exact:true}).tap()
  const editor=page.getByRole('dialog',{name:'Annotate video frame',exact:true})
  await expect(editor).toBeVisible()
  await editor.getByRole('button',{name:'Add note',exact:true}).tap()
  await editor.getByRole('textbox',{name:'Floating annotation text',exact:true}).fill('Lift this title')
  await editor.getByRole('button',{name:'Done',exact:true}).tap()
  await page.screenshot({path:resolve(artifacts,'frame-correction-phone.png')})
  await editor.getByRole('button',{name:'Save frame',exact:true}).tap()
  await expect(editor).toBeHidden()
  // Drawing on the same timestamp intentionally updates that frame's existing
  // review, so verify both notes instead of expecting a second frame record.
  await expect(page.getByRole('button',{name:'Review notes 1',exact:true})).toBeVisible()
  const markedDownload=page.waitForEvent('download')
  await page.getByRole('button',{name:'JSON',exact:true}).tap()
  const markedFile=await markedDownload
  const markedPath=resolve(artifacts,'marked-render-corrections.json')
  await markedFile.saveAs(markedPath)
  const markedReview=JSON.parse(await readFile(markedPath,'utf8'))
  assert.equal(markedReview.entries.length,1)
  assert.deepEqual(markedReview.entries[0].notes,['Move the caption above the speaker','Lift this title'])
  results.push('Phone: saved rendered note, exported render-bound JSON with captured PNG, recovered after reload, and updated the same frame with an additional drawn-frame note.')

  // Comparison uses the same project/source storage identity as the inline studio.
  await page.goto('http://127.0.0.1:4183/comparison')
  await page.getByRole('button',{name:'Compare original and rendered video',exact:true}).tap()
  await expect(page.getByRole('textbox',{name:'Rendered frame note',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Download annotations JSON',exact:true})).toBeEnabled()
  await page.getByRole('button',{name:'Close comparison',exact:true}).tap()
  await context.close()

  for(const device of [
    {name:'small-phone',width:320,height:568,isMobile:true},
    {name:'phone-landscape',width:844,height:390,isMobile:true},
    {name:'phone-desktop-mode',width:980,height:740,isMobile:false},
    {name:'wide-touch',width:1280,height:800,isMobile:false},
  ]){
    const deviceContext=await browser.newContext({viewport:{width:device.width,height:device.height},hasTouch:true,isMobile:device.isMobile,reducedMotion:'reduce'})
    const devicePage=await deviceContext.newPage()
    devicePage.on('pageerror',error=>errors.push(error.message))
    await devicePage.goto('http://127.0.0.1:4183/studio')
    await expect(devicePage.getByRole('textbox',{name:'Rendered frame note',exact:true})).toBeVisible()
    const geometry=await devicePage.evaluate(()=>{
      const note=document.querySelector('[aria-label="Rendered frame note"]')
      const controls=note.closest('form')
      const box=controls.getBoundingClientRect()
      const sizes=[...controls.querySelectorAll('button')].filter(button=>getComputedStyle(button).display!=='none').map(button=>({label:button.getAttribute('aria-label'),width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height}))
      return {pageWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,left:box.left,right:box.right,fontSize:getComputedStyle(note).fontSize,sizes}
    })
    assert.ok(geometry.scrollWidth<=geometry.pageWidth,`${device.name}: no horizontal page overflow`)
    assert.ok(geometry.left>=0&&geometry.right<=geometry.pageWidth,`${device.name}: correction input fits`)
    assert.equal(geometry.fontSize,'16px')
    assert.ok(geometry.sizes.every(button=>button.width>=44&&button.height>=44),`${device.name}: correction targets >=44px`)
    const field=devicePage.getByRole('textbox',{name:'Rendered frame note',exact:true})
    await expect.poll(()=>devicePage.getByLabel('Finished MP4',{exact:true}).evaluate(element=>element.readyState),{timeout:30000}).toBeGreaterThanOrEqual(2)
    await field.fill(`${device.name} correction`)
    await devicePage.getByRole('button',{name:'Save rendered frame note',exact:true}).tap()
    await expect(field).toHaveValue('')
    await expect(devicePage.getByRole('button',{name:'Review notes 1',exact:true})).toBeVisible()
    await devicePage.screenshot({path:resolve(artifacts,`${device.name}.png`),fullPage:true})
    results.push({device:device.name,viewport:`${device.width}x${device.height}`,geometry})
    await deviceContext.close()
  }
  assert.deepEqual(errors,[])
  await writeFile(resolve(artifacts,'verification.json'),JSON.stringify({results,errors},null,2))
  console.log('mobile render feedback browser checks passed')
} finally {await browser.close()}
