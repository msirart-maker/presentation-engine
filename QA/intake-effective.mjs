import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {assertResolvedIntake,resolveIntake} from '../CORE/IntakeResolver.mjs';
import {generatePresentation} from '../BUILDER/generate.mjs';
import {resolveDesign} from '../BUILDER/lib/design-resolver.mjs';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'v134-intake-'));
try{
  const base={title:'A focused strategy',domain:'business',slideCount:7,intake:{status:'complete',answers:{cover:false,motion:'minimal',design:'swiss-editorial',palette:'#2255aa',delivery:'Standalone offline file'}},sections:[{title:'Choose the market',summary:'Prioritize a clear customer group.',items:['Interview customers','Test the offer']},{title:'Sequence delivery',summary:'Assign owners and checkpoints.',items:['Name the owner','Measure outcomes']}],closing:{title:'Make the decision',body:'Agree the first checkpoint.'},generation:{allowQualityWarnings:true}};
  const input=path.join(temp,'request.json'),output=path.join(temp,'deck.html');await fs.writeFile(input,JSON.stringify(base));
  const result=await generatePresentation(input,output),html=await fs.readFile(output,'utf8');
  const schema=JSON.parse(await fs.readFile(result.schemaPath,'utf8'));
  assert.equal(schema.options.showCover,false);assert.equal(schema.design.stylePack,'swiss-editorial');assert.equal(result.design.motion,'none');assert.equal(result.design.palette.mode,'generated');assert.equal(result.receipt.production.assetReview.offlineComplete,true);
  assert.match(html,/data-v13-motion="none"/);assert.match(html,/data-v13-style-pack="swiss-editorial"/);assert.equal(result.receipt.status,'structurally-validated');assert.equal(result.receipt.verification.browser.status,'not-run');
  for(const [name,expected] of [['Yes — show Begin screen',true],['No — open directly',false],[false,false],[true,true]])assert.equal(assertResolvedIntake({intake:{answers:{cover:name}}}).request.options.showCover,expected);
  assert.throws(()=>assertResolvedIntake({options:{showCover:true},intake:{answers:{cover:false}}}),/conflicts/);
  assert.equal(resolveIntake({intake:{answers:{design:'unusual custom theme'}}}).report.status,'needs-resolution');
  assert.equal(resolveIntake({design:{stylePack:'luxury-minimal'},intake:{answers:{design:'unusual custom theme'}}}).report.status,'resolved');
  assert.equal(assertResolvedIntake({intake:{answers:{length:15}}}).request.slideCount,15);
  assert.equal(assertResolvedIntake({intake:{answers:{motion:'Your call'}}}).request.design,undefined);
  const original=structuredClone(base);assertResolvedIntake(base);assert.deepEqual(base,original);
  const a=resolveDesign({...schema,design:{stylePack:'swiss-editorial',palette:{seed:'#ff0000'}}});
  const b=resolveDesign({...schema,design:{stylePack:'swiss-editorial',palette:{seed:'#0000ff'}}});
  assert.notDeepEqual(a.theme.colors,b.theme.colors);
  const brief=JSON.parse(await fs.readFile(output.replace('.html','.brief.json'),'utf8'));assert.equal(brief.request.options.showCover,false);
  console.log('Effective intake: choices verified through HTML generation; conflict, seed palette, and immutable-input regressions passed.');
}finally{await fs.rm(temp,{recursive:true,force:true})}
