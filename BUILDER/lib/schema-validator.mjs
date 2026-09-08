import {compositionPatterns,assertComposition} from '../../COMPOSITIONS/registry.mjs';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const COMPONENT_NAMES=['HeroScene','GlassCard','ImageStoryCard','Timeline','Charts','ComparisonGrid','ReferencePanel','ClosingScene','UIRecipe'];
const COMPONENTS = new Set(COMPONENT_NAMES);
const COMPONENT_SCHEMAS=new Map(COMPONENT_NAMES.map(name=>{
  const url=new URL(`../../COMPONENTS/${name}/schema.json`,import.meta.url);
  return [name,JSON.parse(fs.readFileSync(fileURLToPath(url),'utf8'))];
}));
COMPONENT_SCHEMAS.get('UIRecipe').properties.pattern.enum.push(...compositionPatterns.keys());
const SURFACES = new Set(['deep','dark','light','card','calm']);
const PHASES = new Set(['storm','neutral','calm']);
const DENSITIES = new Set(['auto','airy','balanced','compact']);
const ACCENTS = new Set(['ember','teal','gold','blue']);
const DESIGN_MOODS = new Set(['auto','cinematic','clinical','architectural','editorial','nature','futuristic','luxury','brutalist','bauhaus','swiss']);
const STYLE_PACKS = new Set(['cinematic-glass','swiss-editorial','bauhaus-geometric','luxury-minimal','neo-brutalist','scientific-technical','organic-nature','futuristic-hud']);
const ACCENT_STRATEGIES = new Set(['semantic','alternating','monochrome']);
const ANIMATIONS = new Set(['fade','fadeUp','slideLeft','slideRight','scale','blur','stagger','countUp','chartDraw','particles','heroSequence','chapterTransition','fadeOut','wipe','emphasisPulse']);
const idPattern = /^[A-Za-z][A-Za-z0-9_-]*$/;
const TOP_LEVEL=new Set(['title','description','lang','theme','design','options','assets','assetPolicy','uiLibraries','slides']);
const SLIDE_KEYS=new Set(['id','phase','surface','density','accent','className','ariaLabel','components','animations']);
const COMPONENT_KEYS=new Set(['type','id','role','className','variation','data']);
const ANIMATION_KEYS=new Set(['type','target','duration','delay','easing','trigger','reset','stagger','effect','from','to','decimals','prefix','suffix']);
const ROLES=new Set(['kicker','title','subtitle','stat','heroVisual','card','cardGrid','imageCard','timelineItem','comparisonColumn','reference','quote','uiItem']);

function problem(path, message){ return `${path}: ${message}`; }
function assertObject(value, path, errors){
  if(!value || typeof value !== 'object' || Array.isArray(value)) errors.push(problem(path,'must be an object'));
}

function matchesType(value,type){
  if(type==='object')return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
  if(type==='array')return Array.isArray(value);
  if(type==='number')return typeof value==='number'&&Number.isFinite(value);
  if(type==='integer')return Number.isInteger(value);
  if(type==='string')return typeof value==='string';
  if(type==='boolean')return typeof value==='boolean';
  return true;
}

function validateSchemaValue(value,schema,path,errors){
  if(!schema||typeof schema!=='object')return;
  if(Array.isArray(schema.oneOf)){
    const matched=schema.oneOf.some(option=>{const trial=[];validateSchemaValue(value,option,path,trial);return trial.length===0});
    if(!matched)errors.push(problem(path,'must match one of the allowed schema shapes'));
    return;
  }
  if(Array.isArray(schema.enum)&&!schema.enum.some(item=>Object.is(item,value))){errors.push(problem(path,`must be one of ${schema.enum.join(', ')}`));return}
  if(schema.type&&!matchesType(value,schema.type)){errors.push(problem(path,`must be ${schema.type}`));return}
  if(matchesType(value,'object')){
    for(const key of schema.required||[])if(value[key]===undefined)errors.push(problem(`${path}.${key}`,'is required'));
    for(const[key,child]of Object.entries(schema.properties||{}))if(value[key]!==undefined)validateSchemaValue(value[key],child,`${path}.${key}`,errors);
  }
  if(Array.isArray(value)){
    if(schema.minItems!==undefined&&value.length<schema.minItems)errors.push(problem(path,`must contain at least ${schema.minItems} item(s)`));
    if(schema.maxItems!==undefined&&value.length>schema.maxItems)errors.push(problem(path,`must contain at most ${schema.maxItems} item(s)`));
    if(schema.items)value.forEach((item,index)=>validateSchemaValue(item,schema.items,`${path}[${index}]`,errors));
  }
}

export function validatePresentation(schema){
  const errors=[];
  assertObject(schema,'$',errors);
  if(errors.length) return {valid:false,errors};
  for(const key of Object.keys(schema))if(!TOP_LEVEL.has(key))errors.push(problem(`$.${key}`,'unknown presentation property'));
  if(typeof schema.title!=='string' || !schema.title.trim()) errors.push(problem('$.title','must be a non-empty string'));
  if(!(typeof schema.theme==='string' || (schema.theme && typeof schema.theme==='object'))) errors.push(problem('$.theme','must be a theme name or theme object'));
  if(schema.theme&&typeof schema.theme==='object'&&schema.theme.density&&!DENSITIES.has(schema.theme.density))errors.push(problem('$.theme.density','unknown density'));
  if(schema.design!==undefined){assertObject(schema.design,'$.design',errors);if(schema.design&&typeof schema.design==='object'){for(const key of Object.keys(schema.design))if(!['mode','mood','accentStrategy','density','stylePack','pack','palette','motion','narrativeArc'].includes(key))errors.push(problem(`$.design.${key}`,'unknown design property'));if(schema.design.motion&&!['none','standard','cinematic','precise','geometric','restrained','snappy','analytical','organic','technical','editorial','luxury','brutal','hud'].includes(schema.design.motion))errors.push(problem('$.design.motion','unknown motion policy'));if(schema.design.mode&&!['auto','manual'].includes(schema.design.mode))errors.push(problem('$.design.mode','must be auto or manual'));if(schema.design.mood&&!DESIGN_MOODS.has(schema.design.mood))errors.push(problem('$.design.mood','unknown design mood'));if((schema.design.stylePack||schema.design.pack)&&!STYLE_PACKS.has(schema.design.stylePack||schema.design.pack))errors.push(problem('$.design.stylePack','unknown style pack'));if(schema.design.accentStrategy&&!ACCENT_STRATEGIES.has(schema.design.accentStrategy))errors.push(problem('$.design.accentStrategy','unknown accent strategy'));if(schema.design.density&&!DENSITIES.has(schema.design.density))errors.push(problem('$.design.density','unknown density'));if(schema.design.palette!==undefined&&(!schema.design.palette||typeof schema.design.palette!=='object'||Array.isArray(schema.design.palette)))errors.push(problem('$.design.palette','must be an object'))}}
  if(schema.assetPolicy!==undefined){
    assertObject(schema.assetPolicy,'$.assetPolicy',errors);
    if(schema.assetPolicy&&typeof schema.assetPolicy==='object'){
      for(const key of Object.keys(schema.assetPolicy))if(!['remote','offlineRequired','embedLocal'].includes(key))errors.push(problem(`$.assetPolicy.${key}`,'unknown asset policy option'));
      if(schema.assetPolicy.remote&&!['allow','warn','deny'].includes(schema.assetPolicy.remote))errors.push(problem('$.assetPolicy.remote','must be allow, warn, or deny'));
      for(const key of ['offlineRequired','embedLocal'])if(schema.assetPolicy[key]!==undefined&&typeof schema.assetPolicy[key]!=='boolean')errors.push(problem(`$.assetPolicy.${key}`,'must be boolean'));
    }
  }
  if(schema.uiLibraries!==undefined){assertObject(schema.uiLibraries,'$.uiLibraries',errors);if(schema.uiLibraries&&typeof schema.uiLibraries==='object'){for(const key of Object.keys(schema.uiLibraries))if(!['mode','allow','deny','needs','maxLibraries','preferVendor','network','portable'].includes(key))errors.push(problem(`$.uiLibraries.${key}`,'unknown UI library option'));if(schema.uiLibraries.mode&&!['auto','native','recipe','vendor'].includes(schema.uiLibraries.mode))errors.push(problem('$.uiLibraries.mode','unknown UI library mode'));for(const key of ['allow','deny','needs'])if(schema.uiLibraries[key]!==undefined&&!Array.isArray(schema.uiLibraries[key]))errors.push(problem(`$.uiLibraries.${key}`,'must be an array'));if(schema.uiLibraries.maxLibraries!==undefined&&(!Number.isInteger(schema.uiLibraries.maxLibraries)||schema.uiLibraries.maxLibraries<1||schema.uiLibraries.maxLibraries>6))errors.push(problem('$.uiLibraries.maxLibraries','must be an integer from 1 to 6'))}}
  if(!Array.isArray(schema.slides) || !schema.slides.length) errors.push(problem('$.slides','must contain at least one slide'));
  const ids=new Set();
  (schema.slides||[]).forEach((slide,index)=>{
    const p=`$.slides[${index}]`;
    assertObject(slide,p,errors);
    if(!slide || typeof slide!=='object') return;
    for(const key of Object.keys(slide))if(!SLIDE_KEYS.has(key))errors.push(problem(`${p}.${key}`,'unknown slide property'));
    if(typeof slide.id!=='string' || !idPattern.test(slide.id)) errors.push(problem(`${p}.id`,'must start with a letter and contain only letters, digits, _ or -'));
    else if(ids.has(slide.id)) errors.push(problem(`${p}.id`,`duplicates ${slide.id}`)); else ids.add(slide.id);
    if(slide.surface && !SURFACES.has(slide.surface)) errors.push(problem(`${p}.surface`,'unknown surface'));
    if(slide.phase && !PHASES.has(slide.phase)) errors.push(problem(`${p}.phase`,'unknown phase'));
    if(slide.density && !DENSITIES.has(slide.density)) errors.push(problem(`${p}.density`,'unknown density'));
    if(slide.accent && !ACCENTS.has(slide.accent)) errors.push(problem(`${p}.accent`,'unknown accent'));
    if(!Array.isArray(slide.components) || !slide.components.length) errors.push(problem(`${p}.components`,'must contain at least one component'));
    const componentIds=new Set();
    (slide.components||[]).forEach((component,ci)=>{
      const cp=`${p}.components[${ci}]`;
      assertObject(component,cp,errors);
      if(!component || typeof component!=='object') return;
      for(const key of Object.keys(component))if(!COMPONENT_KEYS.has(key))errors.push(problem(`${cp}.${key}`,'unknown component property'));
      if(component.type==='Charts')for(const chart of component.data?.charts||[]){if((chart.chartType||chart.type)==='gauge'){const min=chart.min??0,max=chart.max??100;if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min)errors.push(problem(cp,'Gauge max must exceed min'));if(!Array.isArray(chart.values)||chart.values.length!==1||!Number.isFinite(chart.values[0]))errors.push(problem(cp,'Gauge requires exactly one finite value'));}}
      if(component.type==='UIRecipe'){try{assertComposition(component.data?.pattern,component.data?.items)}catch(error){errors.push(problem(cp,error.message))}}
      if(!COMPONENTS.has(component.type)) errors.push(problem(`${cp}.type`,`unsupported component ${String(component.type)}`));
      if(component.id){ if(!idPattern.test(component.id)) errors.push(problem(`${cp}.id`,'invalid component id')); if(componentIds.has(component.id)) errors.push(problem(`${cp}.id`,'duplicate component id in slide')); componentIds.add(component.id); }
      if(component.variation!==undefined&&(typeof component.variation!=='string'||!component.variation.trim()))errors.push(problem(`${cp}.variation`,'must be a non-empty string'));
      if(component.data!==undefined && (!component.data || typeof component.data!=='object' || Array.isArray(component.data))) errors.push(problem(`${cp}.data`,'must be an object'));
      else if(COMPONENT_SCHEMAS.has(component.type)) validateSchemaValue(component.data||{},COMPONENT_SCHEMAS.get(component.type),`${cp}.data`,errors);
      if(component.type==='Charts')for(const[chartIndex,chart]of(component.data?.charts||[]).entries()){const chartPath=`${cp}.data.charts[${chartIndex}]`;if(Array.isArray(chart.labels)&&Array.isArray(chart.values)&&chart.labels.length!==chart.values.length)errors.push(problem(chartPath,'labels and values must have equal lengths'));if(Array.isArray(chart.reasons)&&chart.reasons.length&&chart.reasons.length!==chart.values?.length)errors.push(problem(`${chartPath}.reasons`,'must match values length'));if(chart.criticalIndex!==undefined&&(!Number.isInteger(chart.criticalIndex)||chart.criticalIndex<0||chart.criticalIndex>=chart.values?.length))errors.push(problem(`${chartPath}.criticalIndex`,'must identify an existing value'))}
    });
    (slide.animations||[]).forEach((animation,ai)=>{
      const ap=`${p}.animations[${ai}]`;
      assertObject(animation,ap,errors);
      if(!animation || typeof animation!=='object') return;
      for(const key of Object.keys(animation))if(!ANIMATION_KEYS.has(key))errors.push(problem(`${ap}.${key}`,'unknown animation property'));
      if(!ANIMATIONS.has(animation.type)) errors.push(problem(`${ap}.type`,'unsupported animation'));
      if(typeof animation.target!=='string' || !animation.target.trim()) errors.push(problem(`${ap}.target`,'must be a selector or component role'));
      else if(animation.target.startsWith('@')&&!ROLES.has(animation.target.slice(1)))errors.push(problem(`${ap}.target`,`unknown component role ${animation.target}`));
      for(const key of ['duration','delay','stagger']) if(animation[key]!==undefined && (!Number.isFinite(animation[key]) || animation[key]<0)) errors.push(problem(`${ap}.${key}`,'must be a non-negative number'));
      if(animation.trigger && !['slideEnter','slideExit','click','manual'].includes(animation.trigger)) errors.push(problem(`${ap}.trigger`,'invalid trigger'));
      if(animation.reset && !['slideExit','never','replay'].includes(animation.reset)) errors.push(problem(`${ap}.reset`,'invalid reset policy'));
    });
  });
  return {valid:errors.length===0,errors};
}

export function assertValidPresentation(schema){
  const result=validatePresentation(schema);
  if(!result.valid) throw new Error(`Schema validation failed:\n${result.errors.map(e=>`  - ${e}`).join('\n')}`);
  return schema;
}
