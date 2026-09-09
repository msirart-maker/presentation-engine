// Explicit opt-in pagination. Text and data are never shortened or discarded.
const words=value=>typeof value==='string'?value.trim().split(/\s+/).filter(Boolean).length:Array.isArray(value)?value.reduce((n,v)=>n+words(v),0):value&&typeof value==='object'?Object.entries(value).filter(([k])=>!['src','url','source','alt','id'].includes(k)).reduce((n,[,v])=>n+words(v),0):0;
const collections={GlassCard:['cards',4],ImageStoryCard:['images',2],Charts:['charts',1],ReferencePanel:['references',6]};
export class ContentFitter{
 apply(input,{mode=input.options?.contentFit||'preserve'}={}){
  if(!['preserve','split'].includes(mode))throw new Error('contentFit must be preserve or split');
  const schema=structuredClone(input),report={mode,originalSlides:schema.slides?.length||0,slides:[],warnings:[]};
  if(mode==='preserve')return {schema,report:{...report,outputSlides:report.originalSlides}};
  const ids=new Set((schema.slides||[]).map(s=>s.id));
  schema.slides=(schema.slides||[]).flatMap(slide=>{
   const c=slide.components?.[0],spec=c?.type==='UIRecipe'&&c.data?.pattern==='data-table'?['rows',4]:collections[c?.type];
   if(slide.components?.length!==1||!spec||!Array.isArray(c.data?.[spec[0]])){
    if(words(slide.components)>180)report.warnings.push({slideId:slide.id,reason:'Requires editorial review; linked or unsupported content was preserved'});
    return [slide];
   }
   if((slide.animations||[]).some(a=>!a.target?.startsWith('@')&&!['[data-v10-count]','[data-v10-chart]'].includes(a.target))){report.warnings.push({slideId:slide.id,reason:'Custom animation selectors require manual pagination'});return [slide];}
   const [key,limit]=spec,groups=[];let group=[],load=words(c.data.title)+words(c.data.subtitle);
   for(const item of c.data[key]){
    const size=words(item);
    if(group.length&&(group.length>=limit||load+size>160)){groups.push(group);group=[];load=words(c.data.title)+words(c.data.subtitle);}
    group.push(item);load+=size;
    if(size>160)report.warnings.push({slideId:slide.id,reason:'One indivisible item exceeds the reading budget; preserved for review'});
   }
   if(group.length)groups.push(group);
   if(groups.length<2)return [slide];
   const pages=groups.map((items,index)=>{
    const page=structuredClone(slide),component=page.components[0];
    if(index){let suffix=index+1,id=slide.id+'-part-'+suffix;while(ids.has(id))id=slide.id+'-part-'+(++suffix);ids.add(id);page.id=id;}
    if(component.id)component.id=component.id+'-part-'+(index+1);
    component.data[key]=items;
    component.data.title=(c.data.title||'Continued')+' ('+(index+1)+'/'+groups.length+')';
    if(index<groups.length-1)delete component.data.note;
    page.ariaLabel=component.data.title;
    return page;
   });
   report.slides.push({sourceId:slide.id,outputIds:pages.map(p=>p.id),collection:key,itemCount:c.data[key].length,reason:'Reading budget or item capacity exceeded'});
   return pages;
  });
  report.outputSlides=schema.slides.length;return {schema,report};
 }
}
