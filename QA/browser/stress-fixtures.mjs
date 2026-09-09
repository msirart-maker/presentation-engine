import fs from 'node:fs/promises';
import path from 'node:path';
import {buildPresentationData} from '../../BUILDER/build.mjs';
import {AnimationAdvisor} from '../../CORE/AnimationAdvisor.mjs';
import {selectComposition} from '../../COMPOSITIONS/registry.mjs';
const advisor=new AnimationAdvisor();
const slide=(id,type,data)=>({id,phase:'neutral',components:[{type,data}],animations:advisor.forComponent(type)});
const disclaimer='Synthetic layout fixture — not clinical guidance or real-world evidence.';
const items=Array.from({length:6},(_,i)=>({title:['Initial assessment and prioritisation','Review laboratory and bedside findings','Confirm the documented decision','Arrange the next reassessment','Communicate responsibilities clearly','Record the escalation pathway'][i],text:'This fictional workflow contains deliberately extended explanatory text to test readable wrapping, spacing, and hierarchy when a presentation carries practical detail.',label:`Step ${i+1}`}));
const image=(w,h,color)=>'data:image/svg+xml;base64,'+Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${color}"/><path d="M0 0L${w} ${h}M${w} 0L0 ${h}" stroke="white" stroke-width="8"/><rect x="${w*.25}" y="${h*.25}" width="${w*.5}" height="${h*.5}" fill="none" stroke="white" stroke-width="5"/><text x="${w/2}" y="${h/2}" text-anchor="middle" fill="white" font-size="40">${w} × ${h}</text></svg>`).toString('base64');
const decks=[
 ['StressClinical','scientific-technical',[
  slide('long-opening','HeroScene',{title:'From a complex presentation to a clear and coordinated inpatient plan',subtitle:disclaimer,visual:'none',variant:'editorial'}),
  slide('dense-workflow','GlassCard',{title:'Six checkpoints for the fictional pathway',subtitle:disclaimer,columns:3,cards:items}),
  slide('long-table','UIRecipe',{title:'Responsibilities at each transition',subtitle:disclaimer,pattern:'data-table',headers:['Checkpoint','Responsible role','Documentation and follow-up'],rows:items.map((x,i)=>[x.title,`Fictional role ${i+1}`,x.text])}),
  slide('long-identifier','GlassCard',{title:'Record the unbroken identifier',columns:2,cards:[{title:'Reference',text:'SYNTHETIC_REFERENCE_IDENTIFIER_ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ'},{title:'Interpretation',text:'An intentionally long unbroken token must wrap without escaping its card or compressing adjacent content.'}]}),
  slide('clinical-close','ClosingScene',{title:'Detail without losing the message',quote:'Readable hierarchy matters most when the content becomes complex.',credit:disclaimer,visual:'none'})
 ]],
 ['StressCharts','swiss-editorial',[
  slide('chart-opening','HeroScene',{title:'The shape of uneven evidence',subtitle:disclaimer,visual:'none',variant:'poster'}),
  slide('category-chart','Charts',{title:'Long categories and uneven values',subtitle:disclaimer,charts:[{title:'Fictional departmental throughput',chartType:'bar',labels:['Acute medical assessment','Emergency observation unit','Specialist inpatient review','Complex discharge planning','Ambulatory follow-up'],values:[4,97,31,68,12],unit:'cases'}]}),
  slide('paired-charts','Charts',{title:'Two views of the same fictional service',subtitle:disclaimer,charts:[{title:'Demand over twelve periods',chartType:'line',labels:Array.from({length:12},(_,i)=>`Period ${i+1}`),series:[{name:'Planned demand',values:[20,31,18,42,30,48,66,43,52,71,62,90]},{name:'Observed demand',values:[15,38,24,32,54,41,49,58,71,62,88,74]}]},{title:'Distribution of work',chartType:'donut',labels:['Assessment','Follow-up','Coordination','Documentation'],values:[45,25,20,10],centerLabel:'100%'}]}),
  slide('chart-close','ClosingScene',{title:'Labels are part of the evidence',quote:'A chart is only useful when its categories, scales and context can be read.',credit:disclaimer,visual:'none'})
 ]],
 ['StressImages','cinematic-glass',[
  slide('image-opening','HeroScene',{title:'A different frame for every story',subtitle:'Deterministic crop targets, not editorial photography.',image:{src:image(1200,800,'#285b70'),alt:'Landscape crop target',title:'Landscape composition'},layout:'split'}),
  slide('mixed-images','ImageStoryCard',{title:'Mixed aspect ratios',subtitle:'Portrait, landscape and square sources must share a stable layout.',images:[{src:image(600,1000,'#71424a'),alt:'Portrait crop target',title:'Portrait frame',caption:'A tall source with a deliberately extended caption to test its relationship with the image and neighbouring cards.'},{src:image(1200,600,'#285b70'),alt:'Panoramic crop target',title:'Wide frame',caption:'A panoramic source should crop predictably without distorting the frame.'},{src:image(800,800,'#536748'),alt:'Square crop target',title:'Square frame',caption:'A square source completes the comparison.'}]}),
  slide('image-copy','GlassCard',{title:'The image and the message must work together',columns:2,cards:[{title:'Protect the subject',text:'The visible crop should retain the subject, while the title and caption remain legible without hiding essential detail.'},{title:'Protect the reading order',text:'On a narrow screen the image, heading and supporting text should form a coherent sequence rather than a compressed desktop composition.'}]}),
  slide('image-close','ClosingScene',{title:'Make space for the story',quote:'The frame supports the message.',credit:disclaimer,visual:'none'})
 ]]
];
const fitItems=Array.from({length:9},(_,i)=>({...items[i%items.length],title:'Checkpoint '+(i+1)}));
decks.push(['StressFitting','scientific-technical',[
 slide('fit-cards','GlassCard',{title:'Keep every checkpoint readable',columns:3,cards:fitItems}),
 slide('fit-table','UIRecipe',{title:'Preserve every table row',pattern:'data-table',headers:['Checkpoint','Detail'],rows:fitItems.map(item=>[item.title,item.text])}),
 ...['evidence','process'].map(intent=>slide('fit-'+intent,'UIRecipe',{title:'The message determines the composition',pattern:selectComposition({intent,items:items.slice(0,3)}),items:items.slice(0,3)})),
 slide('fit-close','ClosingScene',{title:'Every detail retained',visual:'none'})
]]);
for(const [name,stylePack,slides] of decks){
 const schema={theme:'auto',title:name,design:{stylePack},options:{showCover:false,orientationPrompt:false,contentFit:name==='StressFitting'?'split':'preserve'},assetPolicy:{offlineRequired:true},slides};
 await fs.mkdir('SHOWCASE',{recursive:true});
 await fs.writeFile(`SHOWCASE/${name}.schema.json`,JSON.stringify(schema,null,2)+'\n');
 const built=await buildPresentationData(schema,process.cwd(),path.resolve(`SHOWCASE/${name}.html`));
 if(name==='StressFitting'&&built.slides<=slides.length)throw new Error('Pagination fixture did not create continuation slides');
 console.log(`${name}: ${built.slides} stress slides`);
}
