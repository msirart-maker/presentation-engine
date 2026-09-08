#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RenderRepairPlanner} from '../CORE/RenderRepairPlanner.mjs';
import {assertValidPresentation} from './lib/schema-validator.mjs';
import {buildPresentation} from './build.mjs';

export async function repairRenderedPresentation(schemaPath,reportPath,outputPath,{pass=1}={}){
  const schema=JSON.parse(await fs.readFile(path.resolve(schemaPath),'utf8')),report=JSON.parse(await fs.readFile(path.resolve(reportPath),'utf8'));
  const result=new RenderRepairPlanner().repair(schema,report,pass);assertValidPresentation(result.schema);
  const repairedSchema=outputPath.replace(/\.html?$/i,'.schema.json');
  await fs.writeFile(repairedSchema,JSON.stringify(result.schema,null,2)+'\n');
  const built=await buildPresentation(repairedSchema,outputPath);
  return {...result,repairedSchema,built};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const[,,schema,report,output]=process.argv;if(!schema||!report||!output){console.error('Usage: node BUILDER/repair-render.mjs <schema.json> <render-report.json> <output.html>');process.exit(2)}
  repairRenderedPresentation(schema,report,output).then(result=>console.log(`Applied ${result.applied.length} safe repair(s); ${result.deferred.length} deferred → ${result.built.output}`)).catch(error=>{console.error(error.stack||error);process.exit(1)});
}

