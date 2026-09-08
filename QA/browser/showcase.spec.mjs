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
   await slides.nth(i).evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
   const layout=await slides.nth(i).evaluate(el=>{
    const clipped=[];
    const text=[...el.querySelectorAll('h1,h2,h3,p,li,blockquote')].filter(n=>!n.closest('[aria-hidden="true"],.v10-chart-table')&&n.getClientRects().length);
    for(const n of text){const r=n.getBoundingClientRect();for(let parent=n.parentElement;parent&&parent!==el.parentElement;parent=parent.parentElement){const s=getComputedStyle(parent),b=parent.getBoundingClientRect();if((/hidden|clip/.test(s.overflowY)&&(r.top<b.top-4||r.bottom>b.bottom+4))||(/hidden|clip/.test(s.overflowX)&&(r.left<b.left-4||r.right>b.right+4))){clipped.push(n.textContent.slice(0,90));break;}}}
    return {width:el.clientWidth,scroll:el.scrollWidth,clipped,brokenImages:[...el.querySelectorAll('img')].filter(n=>!n.complete||!n.naturalWidth).length};
   });
   expect(layout.clipped,`slide ${i+1} clipped text`).toEqual([]);
   expect(layout.brokenImages).toBe(0);
   expect(layout.scroll,`slide ${i+1} horizontal overflow`).toBeLessThanOrEqual(layout.width+2);
   await page.screenshot({path:testInfo.outputPath(`${deck}-${String(i+1).padStart(2,'0')}.png`)});
  }
  await page.locator('[data-v10-nav=prev]').click();
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(count-2);
  await page.evaluate(()=>{window.__replayObserved=0;window.__V10_RUNTIME__.bus.on('animation:played',()=>window.__replayObserved++);});
  await page.locator('#v10-replay').click();
  await expect.poll(()=>page.evaluate(()=>window.__replayObserved)).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.transitions.target===null)).toBe(true);
  const original=page.viewportSize();await page.setViewportSize({width:original.height,height:original.width});
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.viewport.lastWidth)).toBe(original.height);
  await expect.poll(()=>page.evaluate(()=>!window.__V10_RUNTIME__.state.pendingLayoutAnchor&&!window.__V10_RUNTIME__.state.isTransitioning())).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(count-2);
  await expect(slides.nth(count-2)).toBeInViewport({ratio:0.4});
  await page.screenshot({path:testInfo.outputPath(`${deck}-rotated.png`)});
  await page.locator('#v10-stage').focus();await page.keyboard.press('ArrowLeft');
  await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(count-3);
  expect(errors).toEqual([]);
 });
}

test('Begin screen: dismiss orientation prompt, activate, then navigate',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/Begin.html');
 await page.waitForFunction(()=>window.__V10_RUNTIME__);
 const prompt=page.locator('#v10-orientation');
 if(await prompt.evaluate(el=>el.classList.contains('is-visible'))){
  await prompt.locator('[data-v10-dismiss]').last().click();
  await expect(prompt).not.toHaveClass(/is-visible/);
 }
 await expect(page.locator('#v10-begin')).toBeVisible();
 expect(await page.evaluate(()=>window.__V10_RUNTIME__.state.state.started)).toBe(false);
 if(testInfo.project.name.endsWith('mobile'))await page.locator('#v10-begin').tap();
 else await page.locator('#v10-begin').click();
 await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.started)).toBe(true);
 await expect(page.locator('#v10-cover')).toHaveClass(/is-hidden/);
 await page.locator('[data-v10-nav=next]').click();
 await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(1);
 await page.screenshot({path:testInfo.outputPath('begin-entered.png')});
 expect(errors).toEqual([]);
});
test('Reduced motion at startup reaches final title and navigates',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/Technical.html');
 await page.waitForFunction(()=>window.__V10_RUNTIME__?.state.state.started);
 expect(await page.evaluate(()=>window.__V10_RUNTIME__.animations.reduced)).toBe(true);
 await page.locator('[data-v10-nav=next]').click();
 await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(1);
 await expect(page.locator('.v10-slide.is-active .v10-title').first()).toHaveCSS('opacity','1');
});
