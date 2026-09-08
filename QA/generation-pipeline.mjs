#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {GenerationPipeline} from '../CORE/GenerationPipeline.mjs';
import {KnowledgeRepository} from '../CORE/KnowledgeRepository.mjs';
import {generatePresentation} from '../BUILDER/generate.mjs';
import {validatePresentation} from '../BUILDER/lib/schema-validator.mjs';
import {validateGenerationRequest} from '../BUILDER/lib/request-validator.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),failures=[];let checks=0;
const check=(name,condition,detail='')=>{checks++;if(!condition)failures.push(`${name}${detail?`: ${detail}`:''}`)};
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'v13-generation-'));
const common={audience:'professional',slideCount:10,intake:{status:'bypassed',reason:'Deterministic QA fixture.'},references:[{title:'Primary source',citation:'Source-grounded reference.',url:'https://example.org/source'}]};
const requests=[
  {...common,title:'Cities Above the Clouds',domain:'architecture',presentationType:'architecture portfolio',description:'How tall buildings become useful urban systems.',sections:[{title:'Vertical pressure',summary:'Dense cities extend upward.',bullets:['Land pressure','Civic identity','Connected mobility']},{title:'Structural evolution',summary:'Frames transformed feasible height.',bullets:['Masonry limits','Steel frames','Composite systems']},{title:'Human performance',summary:'A tower must work for its occupants.',bullets:['Elevator zoning','Wind comfort','Evacuation strategy']}],timeline:[{date:'1880s',title:'Steel frame',text:'Structure separates from wall thickness.'},{date:'Today',title:'Vertical city',text:'Mobility and mixed use converge.'}]},
  {...common,title:'AOSD with recurrent MAS',domain:'medical',presentationType:'case report',description:'A source-grounded clinical case for physicians.',sections:[{title:'Clinical presentation',summary:'A patient developed recurrent hyperinflammation.',bullets:['Spiking fever','Inflammatory rash','Arthralgia']},{title:'Diagnostic evidence',summary:'Laboratory findings supported MAS.',bullets:['Hyperferritinaemia','Hypofibrinogenaemia','Cytopenias']},{title:'Treatment response',summary:'Targeted therapy produced sustained control.',bullets:['Corticosteroid response','Tocilizumab initiation','Outpatient remission']}],timeline:[{date:'Admission',title:'Persistent fever',text:'Investigation began.'},{date:'Treatment',title:'Dexamethasone',text:'Inflammation improved.'}]},
  {...common,title:'The five milliseconds that become a thought',domain:'science',presentationType:'research',description:'A scientific lecture about the neuronal action potential.',sections:[{title:'Resting potential',summary:'Ion gradients store electrochemical energy.',bullets:['Sodium gradient','Potassium conductance','Membrane voltage']},{title:'Rapid depolarisation',summary:'Voltage-gated channels create the spike.',bullets:['Threshold','Sodium influx','Channel inactivation']},{title:'Signal recovery',summary:'Repolarisation restores excitability.',bullets:['Potassium efflux','Refractory period','Propagation']}],timeline:[{date:'0 ms',title:'Threshold',text:'The membrane crosses threshold.'},{date:'5 ms',title:'Recovery',text:'Voltage returns toward baseline.'}]},
  {...common,title:'From market problem to durable growth',domain:'business',presentationType:'investor pitch',description:'An investor narrative for a software company.',sections:[{title:'Customer problem',summary:'Teams lose time coordinating fragmented work.',bullets:['Tool sprawl','Manual handoffs','Poor visibility']},{title:'Product advantage',summary:'One workflow connects planning and execution.',bullets:['Unified data','Automation','Fast adoption']},{title:'Growth system',summary:'Efficient acquisition compounds retention.',bullets:['Expansion revenue','Partner channel','Improving margins']}],timeline:[{date:'Launch',title:'First customers',text:'Product-market learning begins.'},{date:'Scale',title:'Repeatable growth',text:'Retention supports expansion.'}]}
];

for(const[caseIndex,request]of requests.entries()){
  const requestPath=path.join(tmp,`request-${caseIndex}.json`),outputPath=path.join(tmp,`deck-${caseIndex}.html`);
  await fs.writeFile(requestPath,JSON.stringify(request));
  const result=await generatePresentation(requestPath,outputPath);
  const [html,schemaText,planText,receiptText,contentText]=await Promise.all([fs.readFile(outputPath,'utf8'),fs.readFile(result.schemaPath,'utf8'),fs.readFile(result.planPath,'utf8'),fs.readFile(result.receiptPath,'utf8'),fs.readFile(result.contentPath,'utf8')]);
  const schema=JSON.parse(schemaText),plan=JSON.parse(planText),receipt=JSON.parse(receiptText),content=JSON.parse(contentText),validation=validatePresentation(schema);
  check(`case ${caseIndex} schema valid`,validation.valid,validation.errors.join('; '));
  check(`case ${caseIndex} requested slide count`,schema.slides.length===request.slideCount,String(schema.slides.length));
  check(`case ${caseIndex} unique slide ids`,new Set(schema.slides.map(s=>s.id)).size===schema.slides.length);
  check(`case ${caseIndex} unique stage instances`,new Set(plan.stages.map(s=>s.instanceId)).size===plan.stages.length);
  check(`case ${caseIndex} materialized components`,schema.slides.every(s=>s.components.length>=1&&s.components.every(c=>c.data)));
  check(`case ${caseIndex} closing materialized`,schema.slides.at(-1).components[0].type==='ClosingScene',schema.slides.at(-1).components[0].type);
  check(`case ${caseIndex} references materialized`,schema.slides.at(-2).components[0].type==='ReferencePanel',schema.slides.at(-2).components[0].type);
  check(`case ${caseIndex} plan embedded`,html.includes('id="v11-production-plan"')&&html.includes('"version":"13.5.0"'));
  check(`case ${caseIndex} standalone`,!/<script[^>]+src=|<link[^>]+rel=["']stylesheet/i.test(html));
  check(`case ${caseIndex} content ledger`,content.units.length>request.sections.length&&content.allocation.ratio>.75,String(content.allocation.ratio));
  check(`case ${caseIndex} semantic gate`,receipt.narrative.semanticScore>=90,String(receipt.narrative.semanticScore));
  check(`case ${caseIndex} duplication gate`,receipt.narrative.duplicationFindings.length===0,JSON.stringify(receipt.narrative.duplicationFindings));
  check(`case ${caseIndex} composition rhythm`,receipt.composition.maximumConsecutive<=2&&receipt.composition.distinctCompositions>=4,JSON.stringify(receipt.composition));
  check(`case ${caseIndex} honest efficiency label`,receipt.efficiency.claimStatus==='unmeasured'&&receipt.efficiency.measuredEndToEndTokenSavingPercent===null,JSON.stringify(receipt.efficiency));
}

const repository=new KnowledgeRepository();
check('knowledge scenes have ids',repository.index.scenes.every(scene=>scene.id),JSON.stringify(repository.index.scenes.filter(scene=>!scene.id)));
check('zero-overlap scene fallback stays semantic',repository.findScene('urban_context','architecture').id==='urban_context',repository.findScene('urban_context','architecture').id);
const bad={title:'x',theme:'storm',unexpected:true,slides:[{id:'a',components:[{type:'HeroScene',data:{title:'x'}}],animations:[{type:'fadeUp',target:'@notARealRole'}]}]};
const badResult=validatePresentation(bad);
check('validator rejects unknown properties',badResult.errors.some(error=>error.includes('unknown presentation property')),badResult.errors.join('; '));
check('validator rejects unknown animation roles',badResult.errors.some(error=>error.includes('unknown component role')),badResult.errors.join('; '));
const badRequest=validateGenerationRequest({title:'Broken',slideCount:0,unexpected:true,charts:[{labels:['A','B'],values:[1]}]});
check('request validator rejects malformed compact input',!badRequest.valid&&badRequest.errors.length===3,badRequest.errors.join('; '));
let contaminationRejected=false;try{new GenerationPipeline().compile({...requests[0],domain:'medical'})}catch(error){contaminationRejected=error.name==='GenerationQualityError'}
check('cross-domain contamination rejected',contaminationRejected);

const report={version:'13.5.0',status:failures.length?'fail':'pass',checks,failures};
await fs.writeFile(path.join(root,'QA/v13-generation-report.json'),JSON.stringify(report,null,2)+'\n');
if(failures.length){console.error(`V13 generation pipeline failed (${failures.length}/${checks})`);for(const failure of failures)console.error(` - ${failure}`);process.exit(1)}
console.log(`V13 generation pipeline passed: ${checks} checks.`);
