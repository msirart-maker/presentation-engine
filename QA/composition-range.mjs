import assert from 'node:assert/strict';
import {compositionCatalog,assertComposition} from '../COMPOSITIONS/registry.mjs';
import {renderComposition} from '../COMPOSITIONS/render.mjs';
import {GenerationPipeline} from '../CORE/GenerationPipeline.mjs';
const signatures=new Set();
for(const pattern of compositionCatalog.patterns){
 const items=[{id:'root',title:'A clear problem',text:'Describe the evidence.'},{id:'child',parent:'root',edge:'Yes',title:'A next action',text:'Agree ownership.'}];
 const html=renderComposition({pattern:pattern.id,title:'Content',items});assert.ok(html.includes('A clear problem')&&html.includes('A next action'));signatures.add(html.match(/v135-composition v135-([^" ]+)/)[1]);
 const compiled=new GenerationPipeline().compile({title:'Design proof',domain:'business',intake:{status:'bypassed'},slideCount:3,sections:[{title:'Required composition',composition:pattern.id,items}],generation:{allowQualityWarnings:true}});
 assert.ok(compiled.schema.slides.some(s=>s.components.some(c=>c.data.pattern===pattern.id)),pattern.id);
 assert.ok(compiled.schema.slides.every(s=>s.phase==='neutral'));
}
assert.equal(signatures.size,12);assert.throws(()=>assertComposition('decision-tree',[{id:'a',parent:'b'},{id:'b',parent:'a'}]),/cycle/);
assert.throws(()=>assertComposition('decision-tree',[{id:'a',parent:'missing'}]),/does not exist/);
assert.throws(()=>assertComposition('checklist',Array.from({length:7},()=>({title:'x'}))),/split/);
console.log('Composition range: 12 distinct primitives integrated with generation; tree and capacity checks passed.');
