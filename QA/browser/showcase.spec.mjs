import {test,expect} from '@playwright/test';
for(const deck of ['Editorial','Technical','Geometric','Cinematic']){
 test(`${deck}: all slides, navigation, replay and resize`,async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
  await page.goto(`/${deck}.html`);
  await page.waitForFunction(()=>window.__V10_RUNTIME__?.state.state.started===true);
  const slides=page.locator('.v10-slide');const count=await slides.count();expect(count).toBeGreaterThan(1);
  for(let i=0;i<count;i++){
   if(i)await page.locator('[data-v10-nav=next]').click();
   await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(i);
   await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.transitions.target===null)).toBe(true);
   await expect(slides.nth(i)).toHaveClass(/is-active/);
   await expect(slides.nth(i)).toBeInViewport({ratio:0.4});
   const layout=await slides.nth(i).evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));
   expect(layout.scroll,`slide ${i+1} horizontal overflow`).toBeLessThanOrEqual(layout.width+2);
   await page.screenshot({path:testInfo.outputPath(`${deck}-${String(i+1).padStart(2,'0')}.png`)});
  }
  await page.locator('[data-v10-nav=prev]').click();
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(count-2);
  await page.locator('#v10-replay').click();
  const original=page.viewportSize();await page.setViewportSize({width:original.height,height:original.width});
  await expect(slides.nth(count-2)).toBeInViewport({ratio:0.4});
  await page.screenshot({path:testInfo.outputPath(`${deck}-rotated.png`)});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#v10-stage').focus();await page.keyboard.press('ArrowLeft');
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(count-3);
  expect(errors).toEqual([]);
 });
}
