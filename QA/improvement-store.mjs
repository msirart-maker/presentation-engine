import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {ImprovementStore,activeLessons,guidanceFor} from '../CORE/ImprovementStore.mjs';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'v134-memory-'));
try{
 await fs.mkdir(path.join(temp,'QA'));await fs.writeFile(path.join(temp,'feature.mjs'),'export const works=true;');
 await fs.writeFile(path.join(temp,'QA/pass.mjs'),"import {works} from '../feature.mjs';if(!works)process.exit(1);");
 await fs.writeFile(path.join(temp,'QA/fail.mjs'),'process.exit(1)');
 const store=new ImprovementStore(temp),input={summary:'Preserve selected settings',guidance:'Use the effective intake resolver.',domains:['all']};
 const lesson=await store.record(input);assert.equal(activeLessons(temp).length,0);
 assert.equal((await new ImprovementStore(temp).read()).lessons.length,1);
 assert.equal((await store.record(input)).id,lesson.id);assert.equal((await store.read()).lessons.length,1);
 await assert.rejects(()=>store.promote(lesson.id,'QA/fail.mjs',['feature.mjs']));assert.equal(activeLessons(temp).length,0);
 await store.promote(lesson.id,'QA/pass.mjs',['feature.mjs']);assert.equal(activeLessons(temp).length,1);assert.equal(guidanceFor({domain:'medical'},temp).length,1);
 await fs.writeFile(path.join(temp,'feature.mjs'),'export const works=false;');assert.equal(activeLessons(temp).length,0);
 await assert.rejects(()=>store.promote(lesson.id,'../outside.mjs',['feature.mjs']));
 console.log('Improvement store: persistence, deduplication, failed-test rejection, promotion, and stale-code invalidation passed.');
}finally{await fs.rm(temp,{recursive:true,force:true})}
