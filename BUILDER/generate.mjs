#!/usr/bin/env node
import {verifyPresentation} from '../CORE/BrowserVerifier.mjs';
import {assertResolvedIntake} from '../CORE/IntakeResolver.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GenerationPipeline} from '../CORE/GenerationPipeline.mjs';
import {tokenEconomy} from '../CORE/TokenEconomy.mjs';
import {qualityReceipt} from '../CORE/QualityReceipt.mjs';
import {assertValidPresentation} from './lib/schema-validator.mjs';
import {assertValidGenerationRequest} from './lib/request-validator.mjs';
import {buildPresentationData} from './build.mjs';
import {IntakePlanner} from '../CORE/IntakePlanner.mjs';

const jsonPath=(output,suffix)=>output.replace(/\.html?$/i,'')+suffix;

export async function generatePresentation(requestPath,outputPath,{schemaPath,planPath,receiptPath,contentPath}={}){
  const absoluteRequest=path.resolve(requestPath),absoluteOutput=path.resolve(outputPath);
  const originalRequest=JSON.parse(await fs.readFile(absoluteRequest,'utf8'));
  assertValidGenerationRequest(originalRequest);
  const {request,report:intakeResolution}=assertResolvedIntake(originalRequest);
  assertValidGenerationRequest(request);
  const intakePlan=new IntakePlanner().plan(request);
  const enforceIntake=request.generation?.requireIntake!==false&&process.env.V133_REQUIRE_INTAKE!=='0';
  if(enforceIntake&&intakePlan.status!=='ready')throw new Error(`Presentation intake is incomplete. Ask the user before generation, or record an explicit bypass:\n${new IntakePlanner().formatForChat(intakePlan)}`);
  const compiled=new GenerationPipeline().compile(request),{plan,schema}=compiled;
  assertValidPresentation(schema);
  const result=await buildPresentationData(schema,path.dirname(absoluteRequest),absoluteOutput,{plan});
  const efficiency=tokenEconomy({request,schema,htmlBytes:result.bytes,embeddedAssetBytes:result.embeddedAssetBytes});
  const render=request.generation?.renderQA?await verifyPresentation(absoluteOutput):undefined;
  const receipt=qualityReceipt({...compiled,render,tokenEconomy:efficiency,production:{intakeResolution,intake:{enforced:enforceIntake,declaredStatus:request.intake?.status||'missing',plannerStatus:intakePlan.status},contentReview:result.contentReview,assetReview:result.assetReview,responsivePlan:result.responsivePlan,design:result.design,uiLibraries:result.uiLibraryReview}});
  const outputs={
    schema:path.resolve(schemaPath||jsonPath(absoluteOutput,'.schema.json')),
    plan:path.resolve(planPath||jsonPath(absoluteOutput,'.plan.json')),
    receipt:path.resolve(receiptPath||jsonPath(absoluteOutput,'.receipt.json')),
    content:path.resolve(contentPath||jsonPath(absoluteOutput,'.content.json')),
    brief:path.resolve(jsonPath(absoluteOutput,'.brief.json'))
  };
  const contentLedger={version:'13.5.0',summary:compiled.inventory.summary,units:compiled.inventory.units,blocks:compiled.inventory.blocks,allocation:compiled.allocation.coverage};
  await Promise.all([fs.writeFile(outputs.brief,JSON.stringify({request,intakeResolution},null,2)+'\n'),fs.writeFile(outputs.schema,JSON.stringify(schema,null,2)+'\n'),fs.writeFile(outputs.plan,JSON.stringify(plan.toJSON(),null,2)+'\n'),fs.writeFile(outputs.receipt,JSON.stringify(receipt,null,2)+'\n'),fs.writeFile(outputs.content,JSON.stringify(contentLedger,null,2)+'\n')]);
  return {...result,schemaPath:outputs.schema,planPath:outputs.plan,receiptPath:outputs.receipt,contentPath:outputs.content,receipt,compiled,intake:intakePlan};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const[,,input,output]=process.argv;
  if(!input||!output){console.error('Usage: node BUILDER/generate.mjs <request.json> <output.html>');process.exit(2)}
  generatePresentation(input,output).then(result=>{console.log(`Generated ${result.slides} slides → ${result.output} · ${result.receipt.status} · browser ${result.receipt.render.status} · structural score ${result.receipt.qualityScore}/100`);if(result.receipt.render.status==='blocked')process.exitCode=2;else if(result.receipt.status==='review')process.exitCode=1;}).catch(error=>{console.error(error.stack||error);process.exit(1)});
}
