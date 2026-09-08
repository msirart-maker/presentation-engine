import fs from 'node:fs';
export const compositionCatalog=JSON.parse(fs.readFileSync(new URL('./catalog.json',import.meta.url),'utf8'));
export const compositionPatterns=new Map(compositionCatalog.patterns.map(item=>[item.id,item]));
const primitives=new Set(['split','numbered','quote','statement','tree','flow','roadmap','columns','checklist','spotlight','agenda','actions']);
for(const pattern of compositionPatterns.values())if(!primitives.has(pattern.primitive)||!Number.isInteger(pattern.maxItems)||pattern.maxItems<1)throw new Error(`Invalid composition: ${pattern.id}`);
export function selectComposition(block){
 if(block.composition){if(!compositionPatterns.has(block.composition))throw new Error(`Unknown composition ${block.composition}`);return block.composition}
 if(!block.items?.length||block.image||block.chart||block.comparison||block.uiRecipe)return null;
 const text=`${block.title} ${block.summary}`.toLowerCase();
 const candidate=compositionCatalog.patterns.find(pattern=>pattern.id!=='decision-tree'&&pattern.intents.some(intent=>text.includes(intent))&&block.items.length<=pattern.maxItems);
 return candidate?.id||null;
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
