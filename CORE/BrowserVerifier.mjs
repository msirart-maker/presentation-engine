import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
export async function verifyPresentation(file,{engines=['chromium','firefox','webkit'],profiles=[{name:'desktop',width:1440,height:900},{name:'phone-portrait',width:390,height:844,touch:true},{name:'phone-landscape',width:844,height:390,touch:true}],playwrightModule=process.env.V135_PLAYWRIGHT_MODULE}={}){
  const html=await fs.readFile(file),sha256=createHash('sha256').update(html).digest('hex');
  const screenshotsDir=path.join(path.dirname(path.resolve(file)),path.basename(file,path.extname(file))+'.visuals');
  const report={version:'13.5.0',status:'not-run',passed:null,artifact:{name:path.basename(file),sha256},engines,profiles,runs:[],blocked:[],findings:[],scope:'Runtime interactions and layout measurements; no physical-device or aesthetic certification.'};
  let pw;
  try{pw=require(playwrightModule||'playwright')}catch(error){return {...report,status:'blocked',passed:false,blocked:[{reason:'Playwright is unavailable',detail:error.message}]}}
  for(const name of engines){
    let browser;
    try{if(!['chromium','firefox','webkit'].includes(name))throw new Error('Unsupported browser');browser=await pw[name].launch({headless:true})}catch(error){report.blocked.push({engine:name,reason:error.message});continue}
    try{
      for(const profile of profiles){
        const run={engine:name,profile:profile.name,errors:[],slides:[],checks:[]};let context;
        try{
          // Firefox does not implement Playwright's isMobile option. Touch and viewport
          // are independent capabilities, not a claim of mobile-device emulation.
          context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:Boolean(profile.touch),...(name==='firefox'?{}:{isMobile:Boolean(profile.touch)})});
          await fs.mkdir(screenshotsDir,{recursive:true});
          const page=await context.newPage();page.on('pageerror',error=>run.errors.push(error.message));
          await page.goto(pathToFileURL(path.resolve(file)).href,{waitUntil:'load'});
          await page.waitForFunction(()=>window.__V10_RUNTIME__,{timeout:10000});
          if(await page.locator('#v10-orientation.is-visible').count())await page.locator('#v10-orientation [data-v10-dismiss]').last().click();
          const showCover=await page.evaluate(()=>window.__V10_RUNTIME__.options.showCover);
          if(showCover)await page.locator('#v10-begin').click();
          await page.waitForFunction(()=>window.__V10_RUNTIME__.state.state.started,{timeout:15000});
          run.checks.push('begin-or-direct-entry');
          const count=await page.locator('.v10-slide').count();
          for(let i=0;i<count;i++){
            await page.evaluate(i=>{const rt=window.__V10_RUNTIME__;rt.stage.scrollTo({top:rt.slides.slides[i].offsetTop,behavior:'instant'})},i);
            const settle=await page.evaluate(i=>{const steps=window.__V10_RUNTIME__.animations.parse(document.querySelectorAll('.v10-slide')[i]);return Math.min(4000,Math.max(200,...steps.filter(s=>(s.trigger||'slideEnter')==='slideEnter').map(s=>(s.delay||0)+(s.duration||0)+(s.stagger||0)*12)))},i);await page.waitForTimeout(settle);
            const measurement=await page.evaluate(i=>{const slide=document.querySelectorAll('.v10-slide')[i],clip=[],deferred=new Set(window.__V10_RUNTIME__.animations.parse(slide).filter(step=>['click','manual'].includes(step.trigger)).flatMap(step=>window.__V10_RUNTIME__.animations.targets(slide,step.target)));
              const visible=[...slide.querySelectorAll('h1,h2,h3,p,li,blockquote,img')].filter(el=>!el.closest('[aria-hidden="true"],.v10-chart-table')&&el.getClientRects().length);
              for(const el of visible){const r=el.getBoundingClientRect();let parent=el.parentElement;while(parent&&parent!==slide.parentElement){const style=getComputedStyle(parent),b=parent.getBoundingClientRect();if((/hidden|clip/.test(style.overflowY)&&(r.top<b.top-4||r.bottom>b.bottom+4))||(/hidden|clip/.test(style.overflowX)&&(r.left<b.left-4||r.right>b.right+4))){clip.push({element:el.tagName,text:el.textContent.slice(0,80)});break}parent=parent.parentElement}}
              return {id:slide.id,horizontalOverflow:slide.scrollWidth-slide.clientWidth,verticalOverflow:slide.scrollHeight-slide.clientHeight,verticalClipped:/hidden|clip/.test(getComputedStyle(slide).overflowY)&&slide.scrollHeight>slide.clientHeight+4,clippedElements:clip,brokenImages:[...slide.querySelectorAll('img')].filter(img=>!img.complete||img.naturalWidth===0).length,hiddenText:visible.filter(el=>el.matches('h1,h2,h3,p')&&Number(getComputedStyle(el).opacity)===0&&!deferred.has(el)).length,smallText:visible.filter(el=>el.matches('p,li')&&parseFloat(getComputedStyle(el).fontSize)<12).length}},i);
            run.slides.push(measurement);
            if(measurement.verticalClipped||measurement.clippedElements.length)run.errors.push(`${measurement.id}: clipped content`);
            if(measurement.brokenImages||measurement.hiddenText)run.errors.push(`${measurement.id}: missing image or invisible text`);
            if(measurement.smallText)run.errors.push(`${measurement.id}: body text below 12px`);
            await page.screenshot({path:path.join(screenshotsDir,`${name}-${profile.name}-${i+1}.png`)});
            if(measurement.horizontalOverflow>3)run.errors.push(`${measurement.id}: horizontal overflow ${measurement.horizontalOverflow}px`);
          }
          const navigation=await page.evaluate(()=>window.__V10_RUNTIME__.options.showNavigation);
          if(count>1&&navigation){
            await page.evaluate(()=>window.__V10_RUNTIME__.stage.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
            await page.locator('[data-v10-nav="next"]').click();await page.waitForFunction(()=>window.__V10_RUNTIME__.stage.scrollTop>0);
            run.checks.push('next-navigation');
          }
          if(await page.locator('#v10-replay').isVisible()){
            await page.evaluate(()=>{window.__replayCount=0;window.__V10_RUNTIME__.bus.on('animation:played',()=>window.__replayCount++)});
            await page.locator('#v10-replay').click();await page.waitForFunction(()=>window.__replayCount>0);run.checks.push('replay-dispatch-observed');
          }
          const motion=await page.evaluate(()=>({requested:document.documentElement.dataset.v13Motion,animation:window.__V10_RUNTIME__.animations.reduced,charts:window.__V10_RUNTIME__.charts.reduced,media:window.__V10_RUNTIME__.media.reduced}));
          if(motion.requested==='none'&&(!motion.animation||!motion.charts||!motion.media))run.errors.push('No-motion policy not applied to all controllers');
          run.motion=motion;
        }catch(error){run.errors.push(error.message)}finally{await context?.close()}
        run.passed=run.errors.length===0;report.runs.push(run);
      }
    }finally{await browser.close()}
  }
  const failed=report.runs.some(run=>!run.passed);
  report.status=failed?'fail':report.blocked.length?'blocked':report.runs.length?'pass':'blocked';report.passed=report.status==='pass';
  return report;
}
