import fs from 'node:fs';
export const compositionCatalog=JSON.parse(fs.readFileSync(new URL('./catalog.json',import.meta.url),'utf8'));
export const compositionPatterns=new Map(compositionCatalog.patterns.map(item=>[item.id,item]));
const primitives=new Set(['split','numbered','quote','statement','tree','flow','roadmap','columns','checklist','spotlight','agenda','actions']);
for(const pattern of compositionPatterns.values())if(!primitives.has(pattern.primitive)||!Number.isInteger(pattern.maxItems)||pattern.maxItems<1)throw new Error(`Invalid composition: ${pattern.id}`);
export function rankCompositions(block){
 if(!block.items?.length||block.image||block.chart||block.comparison||block.uiRecipe||['opening','closing','references','timeline','chart','images'].includes(block.kind))return [];
 const intent=String(block.intent||'').toLowerCase(),text=String(block.title||'')+' '+String(block.summary||'');
 const semantic={explain:'editorial-split',compare:'tradeoff-columns',evidence:'spotlight',process:'process-flow',sequence:'roadmap',action:'checklist',decision:'decision-tree',quote:'quote-focus'};
 const linked=block.items.some(item=>item.parent);
 return compositionCatalog.patterns.flatMap((pattern,index)=>{
  if(block.items.length>pattern.maxItems)return [];
  if(pattern.primitive==='tree'){
   if(!linked)return [];
   try{assertComposition(pattern.id,block.items)}catch{return []}
  }else if(linked)return [];
  const matches=pattern.intents.filter(word=>new RegExp('(^|[^a-z])'+word+'([^a-z]|$)','i').test(text));
  const score=(semantic[intent]===pattern.id?100:0)+(pattern.primitive==='tree'?80:0)+matches.length*10;
  return score?[{pattern:pattern.id,score,order:index,reason:semantic[intent]===pattern.id?'Explicit communicative intent':linked?'Validated branching relationships':'Matching message and capacity'}]:[];
 }).sort((a,b)=>b.score-a.score||a.order-b.order);
}
export function selectComposition(block,{previousPattern}={}){
 if(block.composition){if(!compositionPatterns.has(block.composition))throw new Error(`Unknown composition ${block.composition}`);return block.composition}
 const ranked=rankCompositions(block),best=ranked[0];
 if(!best)return null;
 return (ranked.find(item=>item.score===best.score&&item.pattern!==previousPattern)||best).pattern;
}
export function assertComposition(pattern,items){
 const spec=compositionPatterns.get(pattern);if(!spec)return;
 if(!Array.isArray(items)||!items.length||items.length>spec.maxItems)throw new Error(`${pattern} requires 1–${spec.maxItems} items; split the content explicitly.`);
 if(spec.primitive==='tree'){
  const ids=new Set();for(const item of items){if(!item.id||ids.has(item.id))throw new Error('Decision nodes require unique IDs');ids.add(item.id)}
  const map=new Map(items.map(item=>[item.id,item]));
  for(const item of items){let current=item,seen=new Set();while(current.parent){if(seen.has(current.id))throw new Error('Decision tree contains a cycle');seen.add(current.id);if(!map.has(current.parent))throw new Error('Decision parent does not exist');current=map.get(current.parent)}}
 }
}
