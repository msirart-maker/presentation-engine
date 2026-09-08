#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPresentationData} from './build.mjs';
import {AnimationAdvisor} from '../CORE/AnimationAdvisor.mjs';
import {compositionCatalog} from '../COMPOSITIONS/registry.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'SHOWCASE');await fs.mkdir(out,{recursive:true});
const advisor=new AnimationAdvisor(),items=[{id:'start',title:'Define the purpose',text:'Give each slide one clear job: explain, compare, decide, or act.'},{id:'evidence',parent:'start',edge:'Evidence available',title:'Show the evidence',text:'Use a chart, sequence, or concise comparison that supports the message.'},{id:'action',parent:'start',edge:'Decision required',title:'Make the next step clear',text:'State the action and the person responsible.'}];
const slide=(id,type,data)=>({id,phase:'neutral',components:[{type,data,variation:'auto'}],animations:[...advisor.forComponent(type),{type:'fadeOut',target:'@title',duration:140,trigger:'slideExit',reset:'slideExit'}]});
const body=compositionCatalog.patterns.map(p=>slide(p.id,'UIRecipe',{title:p.label,subtitle:'Reusable composition • example content',pattern:p.id,items}));
const variants=['title','poster','editorial','chapter'].map((variant,i)=>slide('opening-'+variant,'HeroScene',{title:['A clear idea, beautifully told.','Make the message matter.','The shape of a good decision.','From evidence to action.'][i],subtitle:'A typography-first opening with deliberate visual hierarchy.',variant,visual:i===3?'geometry':'none',layout:'split'}));
const closings=['statement','quote','signature'].map(variant=>slide('closing-'+variant,'ClosingScene',{title:'Clarity is the final impression.',quote:'Give the audience something useful to remember.',credit:'V13.5 composition study',variant,visual:'none'}));
const gauge=slide('gauge-proof','Charts',{title:'Forty out of one hundred',subtitle:'The gauge arc represents 40% of the configured range.',charts:[{title:'Illustrative completion',chartType:'gauge',values:[40],min:0,max:100,unit:'%',centerLabel:'40%'}]});
for(const [file,pack,selection] of [
 ['Editorial','swiss-editorial',[...variants,...body,...closings,gauge]],
 ['Technical','scientific-technical',[variants[0],...body.filter((_,i)=>[4,5,6,8,9].includes(i)),gauge,closings[0]]],
 ['Geometric','bauhaus-geometric',[variants[3],...body.filter((_,i)=>[0,3,5,10,11].includes(i)),closings[2]]],
 ['Cinematic','cinematic-glass',[slide('cinema-open','HeroScene',{title:'A story with intention.',subtitle:'Motion supports the narrative.',visual:'orb',variant:'title',layout:'split'}),...body.filter((_,i)=>[1,2,9,11].includes(i)),closings[1]]]
]){
 const schema={theme:'auto',title:`${file} composition study`,design:{stylePack:pack,motion:file==='Technical'?'restrained':'standard'},options:{showCover:false,orientationPrompt:false,transition:'fade'},assetPolicy:{offlineRequired:true},slides:selection};
 await fs.writeFile(path.join(out,file+'.schema.json'),JSON.stringify(schema,null,2)+'\n');
 const result=await buildPresentationData(schema,root,path.join(out,file+'.html'));console.log(`${file}: ${result.slides} slides`);
}
