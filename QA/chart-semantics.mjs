import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {assertValidPresentation} from '../BUILDER/lib/schema-validator.mjs';
const V10={classes:{}};vm.runInNewContext(fs.readFileSync(new URL('../RUNTIME/ChartController.js',import.meta.url),'utf8'),{window:{V10Engine:V10}});
for(const [value,min,max,expected] of [[40,0,100,.4],[0,0,100,0],[100,0,100,1],[150,0,100,1],[-20,0,100,0],[0,-50,50,.5],[75,50,150,.25]]){
 const arcs=[],ctx={beginPath(){},stroke(){},fillText(){},arc(...args){arcs.push(args)}};
 const controller={setup(){return {ctx,width:500,height:300}},dark(){return false},color(){return '#000'},pulse(){}};
 V10.classes.ChartController.prototype.drawComposition.call(controller,{canvas:{},config:{values:[value],min,max},points:[]},1,-1,'gauge');
 assert.ok(Math.abs((arcs.at(-1)[4]-arcs.at(-1)[3])/Math.PI-expected)<1e-9);
}
const schema=chart=>({title:'Gauge',slides:[{id:'gauge',components:[{type:'Charts',data:{title:'Gauge',charts:[{title:'Value',chartType:'gauge',...chart}]}}]}]});
assert.throws(()=>assertValidPresentation(schema({values:[40],min:100,max:10})),/max must exceed/);
assert.throws(()=>assertValidPresentation(schema({values:[20,30]})),/exactly one/);
console.log('Gauge semantics: 7 numerical cases and 2 invalid-input cases passed.');
