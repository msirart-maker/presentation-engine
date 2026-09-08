import {RENDER_COMPONENTS} from './ProductionPlan.mjs';
import {AnimationAdvisor} from './AnimationAdvisor.mjs';

const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const words=value=>String(value||'').trim();
const slug=value=>words(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'slide';
const titleCase=value=>words(value).replace(/[_-]+/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
const array=value=>Array.isArray(value)?value:(value===undefined||value===null?[]:[value]);
const objectItem=(value,index=0)=>typeof value==='string'?{title:value,text:''}:{title:value?.title||value?.label||`Point ${index+1}`,text:value?.text||value?.summary||value?.body||'',...value};

function normalizeContent(request={}){
  const content=request.content||{};
  const sections=array(request.sections||request.outline||content.sections).map((item,index)=>{
    if(typeof item==='string')return{title:item,summary:'',items:[]};
    return{
      title:item?.title||item?.heading||`Section ${index+1}`,
      summary:item?.summary||item?.description||item?.body||'',
      kicker:item?.kicker||item?.eyebrow||'',
      items:array(item?.items||item?.bullets||item?.points).map(objectItem),
      image:item?.image||null,chart:item?.chart||null,comparison:item?.comparison||null,uiRecipe:item?.uiRecipe||null,
      date:item?.date||'',metric:item?.metric||item?.value||'',visualLabel:item?.visualLabel||''
    };
  });
  return {
    sections,
    facts:array(request.facts||content.facts).map(objectItem),
    timeline:array(request.timeline||content.timeline).map(objectItem),
    charts:array(request.charts||content.charts),
    comparisons:array(request.comparisons||content.comparisons),
    images:array(request.images||content.images),
    references:array(request.references||content.references),
    opening:request.opening||content.opening||{},
    closing:request.closing||content.closing||{}
  };
}

function sectionFor(content,stage,index,total,request){
  const sections=content.sections;
  if(sections.length){
    const position=Math.min(sections.length-1,Math.floor(index*sections.length/Math.max(1,total)));
    return clone(sections[position]);
  }
  const stageTitle=titleCase(stage.beat||stage.stageId);
  return {title:stageTitle,summary:index===0?words(request.description||request.brief):'',kicker:titleCase(stage.stageId),items:[]};
}

function available(type,section,content,index,total){
  if(type==='ClosingScene')return index===total-1;
  if(type==='ReferencePanel')return content.references.length>0;
  if(type==='ImageStoryCard')return Boolean(section.image||content.images.length);
  if(type==='Charts')return Boolean(section.chart||content.charts.length);
  if(type==='Timeline')return content.timeline.length>=2||content.sections.length>=2||section.items.length>=2;
  if(type==='ComparisonGrid')return Boolean(section.comparison||content.comparisons.length||section.items.length>=2||content.facts.length>=2);
  if(type==='UIRecipe')return Boolean(section.uiRecipe);
  return ['HeroScene','GlassCard'].includes(type);
}

function chooseType(stage,section,content,index,total){
  if(index===total-1)return content.references.length&&/reference|source/.test(stage.stageId)?'ReferencePanel':'ClosingScene';
  if(content.references.length&&total>=3&&index===total-2)return'ReferencePanel';
  if(section.uiRecipe)return'UIRecipe';
  const ordered=[stage.components?.primary,...(stage.components?.recommended||[]),'GlassCard'].filter(Boolean);
  return ordered.find(type=>RENDER_COMPONENTS.includes(type)&&available(type,section,content,index,total))||'GlassCard';
}

function variationFor(type,count=1){
  if(type==='HeroScene')return'cinematic';if(type==='GlassCard')return count<=2?'feature':'grid';if(type==='ImageStoryCard')return count===1?'cinema':'gallery';
  if(type==='Timeline')return'rail';if(type==='Charts')return'focus';if(type==='ComparisonGrid')return'versus';if(type==='ReferencePanel')return'editorial';if(type==='ClosingScene')return'minimal';if(type==='UIRecipe')return'portable-recipe';return'standard';
}

function imageValue(value={}){
  return {src:value.src||value.path||'',alt:value.alt||value.title||'Presentation image',title:value.title||'',label:value.label||'',caption:value.caption||value.text||'',source:value.source||value.url||''};
}

function chartValue(value={},title='Data'){
  return {title:value.title||title,eyebrow:value.eyebrow||'Data',chartType:value.chartType||value.type||'line',labels:array(value.labels),values:array(value.values).map(Number),series:array(value.series).map((series,index)=>({name:series?.name||`Series ${index+1}`,values:array(series?.values).map(Number),color:series?.color})),points:array(value.points).map(point=>({label:point?.label||'',x:Number(point?.x),y:Number(point?.y),r:point?.r===undefined?undefined:Number(point.r),value:point?.value===undefined?undefined:Number(point.value)})),matrix:array(value.matrix).map(row=>array(row).map(Number)),xLabels:array(value.xLabels),yLabels:array(value.yLabels),reasons:array(value.reasons),referenceLines:array(value.referenceLines).map(line=>({value:Number(line?.value),label:line?.label||'',color:line?.color,dash:array(line?.dash).map(Number)})),annotations:array(value.annotations).map(note=>({label:note?.label||note?.text||'',text:note?.text||'',at:note?.at,index:Number.isInteger(note?.index)?note.index:undefined,series:Number.isInteger(note?.series)?note.series:undefined,value:note?.value===undefined?undefined:Number(note.value),color:note?.color})),unit:value.unit||'',highlight:value.highlight||'',criticalIndex:value.criticalIndex,centerLabel:value.centerLabel,min:value.min,max:value.max,target:value.target,total:Boolean(value.total),colors:array(value.colors),ariaLabel:value.ariaLabel||''};
}

function comparisonValue(value={},fallback=[]){
  const columns=array(value.columns||value.sides);
  if(columns.length>=2)return columns.slice(0,3).map((column,index)=>({title:column.title||`Perspective ${index+1}`,eyebrow:column.eyebrow||'',text:column.text||'',tone:column.tone,items:array(column.items||column.bullets).map(item=>typeof item==='string'?item:{text:item.text||item.title||'',state:item.state||'neutral'})}));
  const items=fallback.length?fallback:[{title:'Perspective one'},{title:'Perspective two'}];
  const midpoint=Math.max(1,Math.ceil(items.length/2));
  return [items.slice(0,midpoint),items.slice(midpoint)].map((group,index)=>({title:value[ index?'rightTitle':'leftTitle']||`Perspective ${index+1}`,items:(group.length?group:[items[index%items.length]]).map(item=>item.text||item.title||String(item))}));
}

function timelineItems(section,content){
  const source=content.timeline.length?content.timeline:(section.items.length?section.items:content.sections);
  return source.slice(0,6).map((item,index)=>({date:item.date||`Step ${index+1}`,title:item.title||`Stage ${index+1}`,text:item.text||item.summary||'',metric:item.metric||item.value||'',tone:item.tone||['ember','blue','gold','teal'][index%4]}));
}

function cards(section,content){
  const source=section.items.length?section.items:(content.facts.length?content.facts:[{title:section.title,text:section.summary}]);
  return source.slice(0,8).map((item,index)=>({eyebrow:item.eyebrow||item.kicker||'',title:item.title||`Point ${index+1}`,text:item.text||item.summary||'',detail:item.detail||'',value:item.value,count:item.count,tags:array(item.tags),tone:item.tone}));
}

function materializeData(type,{request,content,section,stage,index,total}){
  const stageTitle=titleCase(stage.beat||stage.stageId),title=section.title||stageTitle,kicker=section.kicker||stageTitle,subtitle=section.summary||'';
  if(type==='HeroScene'){
    const opening=index===0?content.opening:{};const image=section.image||content.images[index%Math.max(1,content.images.length)];
    return {variant:opening.variant||request.opening?.variant||'title',visual:opening.visual||request.opening?.visual||'none',kicker:opening.kicker||kicker,title:opening.title||(index===0?(request.title||title):title),subtitle:opening.subtitle||subtitle,body:opening.body||'',layout:image?'split':'centered',visualLabel:opening.visualLabel||section.visualLabel||stageTitle,particles:stage.design?.phase==='calm'?'calm':'storm',...(image?{image:imageValue(image)}:{}),stats:array(opening.stats)};
  }
  if(type==='GlassCard')return{kicker,title,subtitle,cards:cards(section,content),columns:Math.min(4,Math.max(2,Math.ceil(cards(section,content).length/2))),note:section.note||''};
  if(type==='ImageStoryCard'){
    const images=(section.image?[section.image]:content.images).slice(0,4).map(imageValue);
    return{kicker,title,subtitle,featured:images.length===1,images};
  }
  if(type==='Timeline')return{kicker,title,subtitle,items:timelineItems(section,content)};
  if(type==='Charts'){
    const values=(section.chart?[section.chart]:content.charts).slice(0,2).map(chart=>chartValue(chart,title));
    return{kicker,title,subtitle,charts:values};
  }
  if(type==='ComparisonGrid'){
    const source=section.comparison||content.comparisons[index%Math.max(1,content.comparisons.length)]||{};
    return{kicker,title,subtitle,columns:comparisonValue(source,section.items.length?section.items:content.facts),conclusion:source.conclusion||section.conclusion||''};
  }
  if(type==='ReferencePanel')return{kicker:'Sources',title:title||'References',subtitle,references:content.references.map((ref,i)=>({number:String(i+1).padStart(2,'0'),title:ref.title||ref.citation||`Reference ${i+1}`,citation:ref.citation||ref.text||'',url:ref.url||ref.source||'#'}))};
  if(type==='UIRecipe'){
    const recipe=section.uiRecipe||{},source=array(recipe.items).length?array(recipe.items):section.items;
    return{library:recipe.library||'',pattern:recipe.pattern||'feature-grid',kicker:recipe.kicker||kicker,title:recipe.title||title,subtitle:recipe.subtitle||subtitle,columns:recipe.columns,items:source.map(objectItem),headers:array(recipe.headers),rows:array(recipe.rows).map(row=>array(row)),caption:recipe.caption||'',note:recipe.note||''};
  }
  const closing=content.closing;
  return{variant:closing.variant||request.closing?.variant||'statement',visual:closing.visual||request.closing?.visual||'none',kicker:closing.kicker||'Closing',title:closing.title||title||'Thank you',quote:closing.quote||request.description||'',credit:closing.credit||request.presenter||'',visualLabel:closing.visualLabel||'End'};
}

function allocatedContext(block,request){
  const section={title:block.title||'',summary:block.summary||'',kicker:block.kicker||'',items:array(block.items),image:block.image||null,chart:block.chart||null,comparison:block.comparison||null,uiRecipe:block.uiRecipe||null,visualLabel:block.visualLabel||''};
  return {section,content:{sections:[section],facts:block.kind==='facts'?array(block.items):[],timeline:block.kind==='timeline'?array(block.items):[],charts:block.kind==='chart'?[block.chart]:[],comparisons:block.kind==='comparison'?[block.comparison]:[],images:block.kind==='images'?array(block.images):(block.image?[block.image]:[]),references:block.kind==='references'?array(block.references):[],opening:block.kind==='opening'?(block.payload||{}):{},closing:block.kind==='closing'?(block.payload||{}):{}}};
}

function uniqueAnimations(items){
  const seen=new Set();return items.filter(item=>{const key=`${item.type}:${item.target}`;if(seen.has(key))return false;seen.add(key);return true});
}

export class SchemaMaterializer {
  constructor(options={}){this.animations=options.animations||new AnimationAdvisor()}
  materialize(request={},plan,context={}){
    if(!plan?.stages?.length)throw new Error('SchemaMaterializer requires a production plan with stages');
    if(context.allocation?.allocations?.length)return this.materializeAllocated(request,plan,context);
    const content=normalizeContent(request),total=plan.stages.length,seen=new Map();
    const slides=plan.stages.map((stage,index)=>{
      const section=sectionFor(content,stage,index,total,request);if(index>0&&stage.segmentCount>1)section.title=`${section.title}: ${titleCase(stage.beat)}`;const type=chooseType(stage,section,content,index,total);
      const base=slug(stage.instanceId||`${stage.stageId}-${index+1}`),count=(seen.get(base)||0)+1;seen.set(base,count);
      const id=`slide-${base}${count>1?`-${count}`:''}`;
      const data=materializeData(type,{request,content,section,stage,index,total}),contentCount=array(data.cards||data.images||data.items||data.charts||data.columns||data.references).length;
      const automatic=request.design?.mode!=='manual';
      return{id,phase:stage.design?.phase||'neutral',accent:stage.design?.accent||'blue',density:stage.design?.density||'balanced',ariaLabel:`Slide ${index+1}: ${section.title||titleCase(stage.stageId)}`,components:[{id:`${id}-primary`,type,variation:automatic?'auto':(type===stage.components?.primary?(stage.design?.variation||variationFor(type,contentCount)):variationFor(type,contentCount)),data}],animations:type===stage.components?.primary?(stage.animations||[]):this.animations.forComponent(type,{closing:index===total-1})};
    });
    return {title:request.title||request.topic||'Untitled presentation',description:request.description||request.brief||'',lang:request.lang||'en',theme:request.theme||plan.domain||'cinematic',design:{mode:'auto',mood:request.mood||'auto',accentStrategy:request.accentStrategy||'semantic',density:request.density||'auto',...(request.design||{})},assetPolicy:{remote:'warn',offlineRequired:false,embedLocal:true,...(request.assetPolicy||{})},uiLibraries:request.uiLibraries||{mode:'auto'},options:{showCover:true,showCounter:true,showProgress:true,showNavigation:true,showReplay:true,showFullscreen:true,orientationPrompt:true,snap:'proximity',rememberSession:false,...(request.options||{})},slides};
  }

  materializeAllocated(request,plan,{allocation,composition}){
    const selected=allocation.allocations,total=selected.length,compositions=composition?.compositions||[];
    const slides=selected.map((assigned,index)=>{
      const block=assigned.block,stage=plan.stages[index]||plan.stages.at(-1),compositionPlan=compositions[index]||{primary:stage.components?.primary||'GlassCard',secondary:null,layout:'single',design:stage.design||{}};
      const types=[compositionPlan.primary,compositionPlan.secondary].filter(Boolean),allocated=allocatedContext(block,request);
      const components=types.map((type,componentIndex)=>{
        const data=materializeData(type,{request,content:allocated.content,section:allocated.section,stage,index,total});
        if(block.kind==='closing'&&!block.summary)data.quote='';
        if(componentIndex>0){data.kicker='';data.title='';data.subtitle=''}
        return{id:`slide-${slug(block.id)}-${componentIndex+1}`,type,variation:request.design?.mode==='manual'?variationFor(type,array(data.cards||data.images||data.items||data.charts||data.columns||data.references).length):'auto',data};
      });
      const animations=uniqueAnimations(types.flatMap((type,typeIndex)=>this.animations.forComponent(type,{closing:index===total-1}).filter(animation=>typeIndex===0||!['@title','@subtitle'].includes(animation.target))));
      animations.push({type:'fadeOut',target:'@title',trigger:'slideExit',duration:140,reset:'slideExit'});
      const design=compositionPlan.design||stage.design||{};
      return{id:`slide-${slug(block.id)}`,phase:design.phase||stage.design?.phase||'neutral',surface:design.surface,density:design.density||'balanced',accent:design.accent||stage.design?.accent||'blue',className:`composition-${compositionPlan.layout||'single'}`,ariaLabel:`Slide ${index+1}: ${block.title||titleCase(stage.stageId)}`,components,animations};
    });
    return {title:request.title||request.topic||'Untitled presentation',description:request.description||request.brief||'',lang:request.lang||'en',theme:request.theme||plan.domain||'cinematic',design:{mode:'auto',mood:request.mood||'auto',accentStrategy:request.accentStrategy||'semantic',density:request.density||'auto',...(request.design||{})},assetPolicy:{remote:'warn',offlineRequired:false,embedLocal:true,...(request.assetPolicy||{})},uiLibraries:request.uiLibraries||{mode:'auto'},options:{showCover:true,showCounter:true,showProgress:true,showNavigation:true,showReplay:true,showFullscreen:true,orientationPrompt:true,snap:'proximity',rememberSession:false,...(request.options||{})},slides};
  }
}
