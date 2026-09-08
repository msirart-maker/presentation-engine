#!/usr/bin/env node
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function compareRuns(data){
 if(!Array.isArray(data.pairs)||!data.pairs.length)return {status:'unmeasured',measuredTokenSavingsPercent:null,cases:[]};
 const cases=data.pairs.map(pair=>{
  if(!pair.engine||!pair.direct||pair.engine.briefSha256!==pair.direct.briefSha256||!/^[a-f0-9]{64}$/.test(pair.engine.briefSha256||''))throw new Error('Paired runs must share an actual brief SHA-256');
  for(const run of [pair.engine,pair.direct]){
   if(run.qualityAccepted!==true||!run.provider||!run.usageSource)throw new Error('Both runs require quality acceptance and provider usage provenance');
   if(!Number.isInteger(run.inputTokens)||run.inputTokens<0||!Number.isInteger(run.outputTokens)||run.outputTokens<0)throw new Error('Use provider-reported nonnegative integer token counts');
  }
  const engine=pair.engine.inputTokens+pair.engine.outputTokens,direct=pair.direct.inputTokens+pair.direct.outputTokens;if(!direct)throw new Error('Direct run must have nonzero usage');
  return {id:pair.id,engineTokens:engine,directTokens:direct,savingPercent:Math.round((1-engine/direct)*10000)/100};
 });
 return {status:'measured-from-supplied-usage',cases,measuredTokenSavingsPercent:Math.round((1-cases.reduce((s,c)=>s+c.engineTokens,0)/cases.reduce((s,c)=>s+c.directTokens,0))*10000)/100,limitation:'Usage provenance and quality acceptance are supplied by the operator; this command does not contact a model provider.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(compareRuns(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2));
