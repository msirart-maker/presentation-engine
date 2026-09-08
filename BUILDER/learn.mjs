#!/usr/bin/env node
import fs from 'node:fs/promises';
import {ImprovementStore,activeLessons} from '../CORE/ImprovementStore.mjs';
const [command,...args]=process.argv.slice(2),store=new ImprovementStore();
try{
  let result;
  if(command==='record')result=await store.record(JSON.parse(await fs.readFile(args[0],'utf8')));
  else if(command==='promote')result=await store.promote(args[0],args[1],args.slice(2));
  else if(command==='list')result={stored:await store.read(),active:activeLessons()};
  else throw new Error('Usage: learn.mjs record lesson.json | promote ID QA/test.mjs implementation-file [...] | list');
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exitCode=1}
