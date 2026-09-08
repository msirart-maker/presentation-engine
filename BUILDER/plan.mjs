#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GenerationOrchestrator} from '../CORE/GenerationOrchestrator.mjs';

export async function createProductionPlan(inputPath,outputPath){
  const request=JSON.parse(await fs.readFile(path.resolve(inputPath),'utf8'));
  const plan=new GenerationOrchestrator().createPlan(request).toJSON();
  await fs.mkdir(path.dirname(path.resolve(outputPath)),{recursive:true});
  await fs.writeFile(path.resolve(outputPath),JSON.stringify(plan,null,2)+'\n');
  return plan;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const[,,input,output]=process.argv;
  if(!input||!output){console.error('Usage: node BUILDER/plan.mjs <request.json> <production-plan.json>');process.exit(2)}
  createProductionPlan(input,output).then(plan=>console.log(`Planned ${plan.stages.length} slides using ${plan.blueprint.id} (${plan.domain}).`)).catch(error=>{console.error(error.stack||error);process.exit(1)});
}
