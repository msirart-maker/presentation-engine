import {test,expect} from '@playwright/test';
for(const deck of ['StressClinical','StressCharts','StressImages'])test(`${deck}: readable content in both orientations`,async({page},info)=>{
 test.setTimeout(180000);
 const errors=[],measurements=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/${deck}.html`);
 await page.waitForFunction(()=>window.__V10_RUNTIME__?.state.state.started);
 const initial=page.viewportSize();
 for(const viewport of [initial,{width:initial.height,height:initial.width}]){
  await page.setViewportSize(viewport);
  await page.waitForTimeout(900);
  const count=await page.locator('.v10-slide').count();
  for(let i=0;i<count;i++){
   await page.evaluate(async i=>{const r=window.__V10_RUNTIME__;await r.slides.goTo(i);},i);
   await expect.poll(()=>page.evaluate(()=>window.__V10_RUNTIME__.state.state.activeSlideIndex)).toBe(i);
   const slide=page.locator('.v10-slide').nth(i);
   await slide.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));});
   const metrics=await slide.evaluate(el=>{
    const issues=[];
    const text=[...el.querySelectorAll('h1,h2,h3,p,li,td,th,blockquote')].filter(n=>!n.closest('[aria-hidden="true"],.v10-chart-table,details:not([open])')&&n.getClientRects().length);
    for(const n of text){
     const range=document.createRange();range.selectNodeContents(n);
     const r=range.getBoundingClientRect(),style=getComputedStyle(n);
     if(n.matches('p,li,td,th')&&parseFloat(style.fontSize)<12)issues.push({reason:'small-text',text:n.textContent.slice(0,70),size:style.fontSize});
     for(let p=n.parentElement;p&&p!==el.parentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if((/hidden|clip/.test(s.overflowY)&&(r.top<b.top-4||r.bottom>b.bottom+4))||(/hidden|clip/.test(s.overflowX)&&(r.left<b.left-4||r.right>b.right+4))){issues.push({reason:'clipped',text:n.textContent.slice(0,70)});break;}}
    }
    if(el.scrollWidth>el.clientWidth+3)issues.push({reason:'horizontal-overflow',pixels:el.scrollWidth-el.clientWidth});
    for(const img of el.querySelectorAll('img'))if(!img.complete||!img.naturalWidth)issues.push({reason:'broken-image'});
    return {id:el.id,issues};
   });
   measurements.push({viewport,...metrics});
   const key=`${deck}-${viewport.width}x${viewport.height}-${i+1}`;
   const geometry=await slide.evaluate(el=>{const stage=document.querySelector('#v10-stage');return {top:stage.scrollTop+el.getBoundingClientRect().top-stage.getBoundingClientRect().top,height:el.offsetHeight,viewport:stage.clientHeight};});
   const steps=Math.max(1,Math.ceil(geometry.height/geometry.viewport));
   for(let part=0;part<steps;part++){
    const offset=Math.min(part*geometry.viewport,Math.max(0,geometry.height-geometry.viewport));
    await page.evaluate(top=>document.querySelector('#v10-stage').scrollTo({top,behavior:'instant'}),geometry.top+offset);
    await page.waitForTimeout(250);
    await page.screenshot({path:info.outputPath(`${key}-part${part+1}.png`)});
   // A small JPEG copy in the authenticated job log permits direct visual review
   // alongside the full-resolution PNG artifacts, without publishing a website.
   if(info.project.name.startsWith('chromium-')){
    const jpeg=await page.screenshot({type:'jpeg',quality:55});
    console.log('VISUAL_REVIEW '+JSON.stringify({key:key+'-part'+(part+1),image:jpeg.toString('base64')}));
   }
   }
  }
 }
 await info.attach('layout-measurements',{body:JSON.stringify(measurements,null,2),contentType:'application/json'});
 console.log('STRESS_FINDINGS '+JSON.stringify({deck,project:info.project.name,findings:measurements.filter(m=>m.issues.length)}));
 expect(errors).toEqual([]);
 expect(measurements.flatMap(m=>m.issues)).toEqual([]);
});
