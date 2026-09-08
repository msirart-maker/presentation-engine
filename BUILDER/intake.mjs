#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {IntakePlanner} from '../CORE/IntakePlanner.mjs';

export async function planIntake(requestPath,{format='json'}={}){
  const absolute=path.resolve(requestPath),request=JSON.parse(await fs.readFile(absolute,'utf8')),planner=new IntakePlanner(),plan=planner.plan(request);
  return format==='chat'?planner.formatForChat(plan):plan;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const[,,input,...flags]=process.argv;if(!input){console.error('Usage: node BUILDER/intake.mjs <partial-request.json> [--chat]');process.exit(2)}
  try{const result=await planIntake(input,{format:flags.includes('--chat')?'chat':'json'});console.log(typeof result==='string'?result:JSON.stringify(result,null,2))}catch(error){console.error(error.stack||error);process.exit(1)}
}
