#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GenerationOrchestrator} from '../CORE/GenerationOrchestrator.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=[
  'BUILDER/build.mjs','BUILDER/generate.mjs','CORE/GenerationPipeline.mjs','CORE/ContentInventory.mjs','CORE/NarrativeAllocator.mjs','CORE/CompositionPlanner.mjs','CORE/GenerationOrchestrator.mjs','CORE/SchemaMaterializer.mjs','CORE/PresentationDirector.mjs','KNOWLEDGE_INDEX/v13-runtime-index.json',
  'CORE/IntakeResolver.mjs','CORE/BrowserVerifier.mjs','CORE/ImprovementStore.mjs','PRESENTATION_BLUEPRINTS/blueprints-v13.3.json'
];
const checks=[];
for(const rel of required){try{const st=await fs.stat(path.join(ROOT,rel));checks.push({check:rel,status:st.size>0?'pass':'fail',bytes:st.size})}catch{checks.push({check:rel,status:'fail',bytes:0})}}
let planner='pass',plannerDetail='';
try{const plan=new GenerationOrchestrator().createPlan({title:'Clinical diagnostic case',domain:'medical',presentationType:'case report',slideCount:8});plannerDetail=plan.summary()}catch(error){planner='fail';plannerDetail=error.message}
checks.push({check:'orchestrator_boot',status:planner,detail:plannerDetail});
const status=checks.every(c=>c.status==='pass')?'pass':'fail';
const report={engine:'V13.5 Master Engine',version:'13.5.0',status,checks};
console.log(JSON.stringify(report,null,2));
if(status!=='pass')process.exit(1);
