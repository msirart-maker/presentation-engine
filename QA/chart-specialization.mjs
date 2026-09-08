#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GenerationPipeline} from '../CORE/GenerationPipeline.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),runtime=await fs.readFile(path.join(root,'RUNTIME/ChartController.js'),'utf8'),renderer=await fs.readFile(path.join(root,'BUILDER/lib/component-renderer.mjs'),'utf8'),failures=[];
const check=(name,value)=>{if(!value)failures.push(name)};
check('slope has dedicated renderer',runtime.includes("type==='slope')this.drawSlope")&&runtime.includes('drawSlope(record,progress,hover)'));
check('bump has dedicated renderer',runtime.includes("type==='bump')this.drawBump")&&runtime.includes('drawBump(record,progress,hover)'));
check('reference lines and annotations render',runtime.includes('referenceLines(ctx,a,config,dark)')&&runtime.includes('annotations(ctx,a,config,labels,dark)'));
check('tooltip requires proximity',runtime.includes('distance<=threshold'));
check('accessible data table renders',renderer.includes('v13-chart-data')&&renderer.includes('<table>'));
const request={title:'Chart contract',domain:'business',slideCount:3,charts:[{title:'Trend',type:'line',labels:['A','B'],values:[2,5],referenceLines:[{value:4,label:'Target'}],annotations:[{index:1,label:'Peak'}]}],intake:{status:'bypassed'},generation:{allowQualityWarnings:true}},compiled=new GenerationPipeline().compile(request),chart=compiled.schema.slides.flatMap(slide=>slide.components).find(component=>component.type==='Charts')?.data?.charts?.[0];
check('materializer preserves reference lines',chart?.referenceLines?.[0]?.label==='Target');
check('materializer preserves annotations',chart?.annotations?.[0]?.label==='Peak');
const report={version:'13.5.0',generatedAt:new Date().toISOString(),status:failures.length?'fail':'pass',checks:7,failures};await fs.writeFile(path.join(root,'QA/chart-specialization-report.json'),JSON.stringify(report,null,2)+'\n');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}console.log('Chart specialization passed: 7 checks.');
