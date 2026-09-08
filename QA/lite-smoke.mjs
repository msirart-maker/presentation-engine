#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {generatePresentation} from '../BUILDER/generate.mjs';

const temp=await fs.mkdtemp(path.join(os.tmpdir(),'v133-lite-'));
try{
  const request=path.join(temp,'request.json'),output=path.join(temp,'presentation.html');
  await fs.writeFile(request,JSON.stringify({title:'AI Runtime Lite smoke test',audience:'executive team',domain:'business',intent:'strategy_brief',slideCount:7,intake:{status:'bypassed',reason:'Deterministic package smoke test.'},sections:[{title:'Decision',summary:'Choose a focused operating path.',items:['Prioritize the highest-confidence segment','Sequence delivery against capacity']},{title:'Evidence',summary:'Supplied evidence drives the recommendation.',items:['Signal one','Signal two','Signal three']}],facts:[{label:'Decision window',value:'Q4',detail:'Planning horizon supplied by fixture'}],closing:{title:'Decide, sequence, measure',body:'Confirm the owner and the first checkpoint.'},assetPolicy:{offlineRequired:true},generation:{allowQualityWarnings:true}},null,2));
  const result=await generatePresentation(request,output),html=await fs.readFile(output,'utf8');
  const checks=[result.slides>=6,html.includes('<!doctype html>'),html.includes('data-v13-style-pack='),html.includes('v10-slide'),!/<script[^>]+src=|<link[^>]+rel=["']stylesheet/i.test(html),result.receipt.production?.assetReview?.offlineComplete===true,result.receipt.production?.intake?.plannerStatus==='ready'];
  if(checks.some(value=>!value))throw new Error(`Lite smoke test failed: ${checks.map((value,index)=>`${index+1}:${value?'pass':'fail'}`).join(', ')}`);
  console.log(`AI Runtime Lite passed: ${checks.length} checks, ${result.slides} slides.`);
}finally{await fs.rm(temp,{recursive:true,force:true})}
