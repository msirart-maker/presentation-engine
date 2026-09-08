#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {GenerationOrchestrator} from '../CORE/GenerationOrchestrator.mjs';
import {RENDER_COMPONENTS} from '../CORE/ProductionPlan.mjs';
import {buildPresentation} from '../BUILDER/build.mjs';

const failures=[];let checks=0;
const check=(name,condition,detail='')=>{checks++;if(!condition)failures.push(`${name}${detail?`: ${detail}`:''}`)};
const orchestrator=new GenerationOrchestrator();
const cases=[
  [{title:'AOSD with MAS clinical case',audience:'physicians',presentationType:'case report',slideCount:16},'medical','medical_case_report'],
  [{title:'Neuronal action potential',description:'scientific research lecture',presentationType:'research',slideCount:12},'science','research_story'],
  [{title:'Series A investor pitch',domain:'business',slideCount:14},'business','investor_pitch'],
  [{title:'Skyscraper design portfolio',domain:'architecture',slideCount:18},'architecture','architecture_portfolio']
];
for(const[request,domain,blueprint]of cases){
  const plan=orchestrator.createPlan(request).toJSON();
  check(`${domain} detection`,plan.domain===domain,plan.domain);
  check(`${domain} blueprint`,plan.blueprint.id===blueprint,plan.blueprint.id);
  check(`${domain} slide count`,plan.stages.length===request.slideCount,String(plan.stages.length));
  check(`${domain} final closes`,plan.stages.at(-1).components.primary==='ClosingScene',plan.stages.at(-1).components.primary);
  for(const stage of plan.stages)for(const component of stage.components.recommended)check(`${domain} supported ${component}`,RENDER_COMPONENTS.includes(component),component);
  check(`${domain} compact knowledge`,Object.values(plan.knowledge).flatMap(v=>Array.isArray(v)?v:[]).every(v=>typeof v==='string'),JSON.stringify(plan.knowledge));
}
const medical=orchestrator.createPlan(cases[0][0]).toJSON();
check('clinical mystery does not borrow turning point recipe',medical.stages[0].recipe===null,medical.stages[0].recipe?.id||'null');
check('turning point uses recipe',medical.stages.some(s=>s.stageId==='diagnostic_turning_point'&&s.recipe?.id==='clinical_turning_point'));

const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'v117-'));
const result=await buildPresentation(new URL('../VALIDATION/02_scientific_lecture/schema.json',import.meta.url).pathname,path.join(tmp,'out.html'));
const html=await fs.readFile(result.output,'utf8');
check('end-to-end build',result.slides===12,String(result.slides));
check('production plan embedded',html.includes('id="v11-production-plan"'));
check('review embedded',html.includes('id="v11-intelligence-review"'));
check('build plan uses science',result.plan?.domain==='science',result.plan?.domain);

const report={version:'13.5.0',status:failures.length?'fail':'pass',checks,failures};
await fs.writeFile(new URL('./v13-orchestrator-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if(failures.length){console.error(`V13 orchestrator smoke failed (${failures.length}/${checks})`);for(const f of failures)console.error(` - ${f}`);process.exit(1)}
console.log(`V13 orchestrator smoke passed: ${checks} checks.`);
