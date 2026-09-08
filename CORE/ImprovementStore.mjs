import fs from 'node:fs/promises';
import sync from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function contained(base,relative){if(typeof relative!=='string'||path.isAbsolute(relative))throw new Error('Use a relative engine path');const real=sync.realpathSync(path.resolve(base,relative)),parent=sync.realpathSync(base);if(!real.startsWith(parent+path.sep))throw new Error('Path escapes engine');return real}
export function activeLessons(base=root){
  const file=path.join(base,'IMPROVEMENTS/lessons.json');if(!sync.existsSync(file))return [];
  const data=JSON.parse(sync.readFileSync(file,'utf8'));
  return (data.lessons||[]).filter(lesson=>lesson.status==='validated'&&Object.entries(lesson.validation?.fingerprints||{}).length>0&&Object.entries(lesson.validation.fingerprints).every(([file,digest])=>{try{return hash(sync.readFileSync(contained(base,file)))===digest}catch{return false}}));
}
export function guidanceFor(request,base=root){const domain=request.domain||'general';return activeLessons(base).filter(lesson=>lesson.domains.includes('all')||lesson.domains.includes(domain)).map(({id,summary,guidance})=>({id,summary,guidance}));}
export class ImprovementStore{
  constructor(base=root){this.base=base;this.file=path.join(base,'IMPROVEMENTS/lessons.json')}
  async read(){try{return JSON.parse(await fs.readFile(this.file,'utf8'))}catch(error){if(error.code==='ENOENT')return {version:'13.5.0',lessons:[]};throw error}}
  async update(change){await fs.mkdir(path.dirname(this.file),{recursive:true});const lock=await fs.open(this.file+'.lock','wx');try{const data=await this.read();const result=await change(data);const tmp=this.file+'.tmp';await fs.writeFile(tmp,JSON.stringify(data,null,2)+'\n');await fs.rename(tmp,this.file);return result}finally{await lock.close();await fs.unlink(this.file+'.lock')}}
  async record(input){
    for(const field of ['summary','guidance'])if(typeof input[field]!=='string'||!input[field].trim())throw new Error(`${field} is required`);
    if(!Array.isArray(input.domains)||!input.domains.length||!input.domains.every(x=>typeof x==='string'))throw new Error('domains must be a nonempty string array');
    const clean={summary:input.summary.trim(),guidance:input.guidance.trim(),domains:[...new Set(input.domains)].sort()},id=hash(JSON.stringify(clean)).slice(0,16);
    return this.update(data=>{let lesson=data.lessons.find(x=>x.id===id);if(!lesson){lesson={id,...clean,status:'pending'};data.lessons.push(lesson)}return lesson});
  }
  async promote(id,test,files=[]){
    const testPath=contained(this.base,test),qa=sync.realpathSync(path.join(this.base,'QA'));
    if(!testPath.startsWith(qa+path.sep)||!testPath.endsWith('.mjs'))throw new Error('Regression test must be a QA/*.mjs file');
    if(!files.length)throw new Error('Supply the implementation files covered by the regression test');
    const observed=[...new Set([test,...files])],fingerprints=Object.fromEntries(observed.map(file=>[file,hash(sync.readFileSync(contained(this.base,file)))]));
    execFileSync(process.execPath,[testPath],{cwd:this.base,timeout:60000,stdio:'pipe'});
    for(const [file,digest] of Object.entries(fingerprints))if(hash(sync.readFileSync(contained(this.base,file)))!==digest)throw new Error('Files changed during validation');
    return this.update(data=>{const lesson=data.lessons.find(x=>x.id===id);if(!lesson)throw new Error('Unknown lesson ID');lesson.status='validated';lesson.validation={test,fingerprints};return lesson});
  }
}
