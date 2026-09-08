import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'UI_LIBRARIES/catalog.json'),'utf8'));
const recipes=JSON.parse(fs.readFileSync(path.join(root,'UI_LIBRARIES/recipes.json'),'utf8')).recipes;
const byId=new Map(catalog.libraries.map(item=>[item.id,item]));
const array=value=>Array.isArray(value)?value:(value===undefined||value===null?[]:[value]);
const classNames=(...values)=>[...new Set(values.flatMap(value=>String(value||'').split(/\s+/)).filter(Boolean))].join(' ');

function inferNeeds(schema){
  const needs=new Set(array(schema.uiLibraries?.needs));
  for(const slide of schema.slides||[])for(const component of slide.components||[]){
    if(component.type==='GlassCard'){needs.add('cards');needs.add('bento')}
    if(component.type==='Charts'){needs.add('charts');needs.add('progress');needs.add('data-table')}
    if(component.type==='Timeline'){needs.add('stepper');needs.add('timeline')}
    if(component.type==='ComparisonGrid'){needs.add('callouts');needs.add('status')}
    if(component.type==='ReferencePanel'){needs.add('data-table');needs.add('accordion')}
    if(component.type==='UIRecipe')needs.add(component.data?.pattern||'cards');
  }
  return [...needs];
}

function hasVendor(id){try{return fs.statSync(path.join(root,'UI_LIBRARIES/vendor',id,'manifest.json')).isFile()}catch{return false}}

function scoreLibrary(library,{needs,stylePack,allow,indexByAllow}){
  let score=library.portableScore||0;
  if(library.styles?.includes(stylePack))score+=14;
  score+=library.capabilities?.filter(item=>needs.includes(item)).length*7;
  if(allow.length)score+=Math.max(0,80-(indexByAllow.get(library.id)||0)*4);
  if(library.category==='design-tokens')score+=2;
  return score;
}

function chooseMode(library,config){
  if(config.mode==='recipe')return library.integration.includes('recipe')?'recipe':'advisor';
  if(config.mode==='vendor')return library.integration.includes('vendor')&&hasVendor(library.id)?'vendor':library.integration.includes('recipe')?'recipe':'advisor';
  if(config.preferVendor&&library.integration.includes('vendor')&&hasVendor(library.id))return'vendor';
  return library.integration.includes('recipe')?'recipe':'advisor';
}

function decorate(schema,selections){
  const clone=structuredClone(schema),recipeSelections=selections.filter(item=>item.mode==='recipe'||item.mode==='vendor');
  clone.slides=(clone.slides||[]).map(slide=>({...slide,components:(slide.components||[]).map(component=>{
    let selection=null,pattern='';
    if(component.type==='UIRecipe')selection=recipeSelections.find(item=>item.id===component.data?.library)||recipeSelections.find(item=>recipes[item.id]?.patterns?.includes(component.data?.pattern))||recipeSelections[0];
    else selection=recipeSelections.find(item=>recipes[item.id]?.componentMap?.[component.type]);
    if(!selection)return component;
    pattern=component.type==='UIRecipe'?(component.data?.pattern||recipes[selection.id]?.patterns?.[0]||'feature-grid'):recipes[selection.id]?.componentMap?.[component.type];
    const data=component.type==='UIRecipe'?{...component.data,library:component.data?.library||selection.id,pattern}:{...component.data};
    return{...component,data,className:classNames(component.className,`ui-source-${selection.id}`,pattern?`ui-pattern-${pattern}`:'')};
  })}));
  return clone;
}

export class UILibraryResolver{
  resolve(schema={}){
    const config={mode:'auto',allow:[],deny:[],needs:[],maxLibraries:catalog.policy.maximumAutomaticLibraries,preferVendor:false,network:'deny',portable:true,...(schema.uiLibraries||{})};
    const needs=inferNeeds(schema),stylePack=schema.__design?.stylePack||schema.design?.stylePack||schema.design?.pack||'cinematic-glass',allow=array(config.allow),deny=new Set(array(config.deny)),indexByAllow=new Map(allow.map((id,index)=>[id,index]));
    if(config.mode==='native')return{schema,review:{version:'13.5.0',status:'native-only',policy:'portable-first',stylePack,needs,selections:[],warnings:[],networkUsed:false,thirdPartyCodeImported:false}};
    const unknown=allow.filter(id=>!byId.has(id)),candidates=catalog.libraries.filter(item=>item.approved&&!deny.has(item.id)&&(!allow.length||allow.includes(item.id))&&item.integration.some(mode=>['recipe','vendor','advisor'].includes(mode)));
    const ranked=candidates.map(library=>({library,score:scoreLibrary(library,{needs,stylePack,allow,indexByAllow})})).sort((a,b)=>b.score-a.score||a.library.id.localeCompare(b.library.id));
    const max=Math.max(1,Math.min(6,Number(config.maxLibraries)||catalog.policy.maximumAutomaticLibraries)),chosen=[];
    if(allow.length)chosen.push(...ranked.slice(0,max));
    else{const pool=[...ranked],uncovered=new Set(needs);while(pool.length&&chosen.length<max){pool.sort((a,b)=>{const added=item=>item.library.capabilities.filter(capability=>uncovered.has(capability)).length;return added(b)*30+b.score-(added(a)*30+a.score)||a.library.id.localeCompare(b.library.id)});const next=pool.shift(),adds=next.library.capabilities.filter(capability=>uncovered.has(capability));if(chosen.length&&needs.length&&adds.length===0)break;chosen.push(next);for(const capability of adds)uncovered.delete(capability)}}
    const selected=chosen.map(({library,score})=>{const mode=chooseMode(library,config);return{id:library.id,label:library.label,mode,score,license:library.license,source:library.source,capabilities:library.capabilities.filter(item=>needs.includes(item)),codeImported:mode==='vendor'}});
    const warnings=[];
    if(unknown.length)warnings.push({code:'UNKNOWN_UI_LIBRARY',message:`Unknown UI libraries were ignored: ${unknown.join(', ')}`});
    if(config.network!=='deny')warnings.push({code:'NETWORK_POLICY_NORMALIZED',message:'Generation-time network access remains disabled. Vendor assets must be acquired and locked before generation.'});
    if(config.mode==='vendor')for(const item of selected)if(item.mode!=='vendor')warnings.push({code:'VENDOR_FALLBACK',library:item.id,message:`${item.label} is not locally vendored; portable recipe mode was used.`});
    const decorated=decorate(schema,selected),review={version:'13.5.0',status:selected.length?'resolved':'native-fallback',policy:'portable-first',stylePack,needs,selections:selected,warnings,networkUsed:false,thirdPartyCodeImported:selected.some(item=>item.codeImported),catalogVersion:catalog.version};
    decorated.__uiLibraries=review;
    return{schema:decorated,review};
  }
  catalog(){return structuredClone(catalog)}
}

export const UI_LIBRARY_IDS=Object.freeze(catalog.libraries.map(item=>item.id));
export const UI_LIBRARY_POLICY=Object.freeze(catalog.policy);
