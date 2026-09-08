import fs from 'node:fs/promises';
import path from 'node:path';
import {buildPresentationData} from '../../BUILDER/build.mjs';
const schema=JSON.parse(await fs.readFile('SHOWCASE/Technical.schema.json','utf8'));
schema.options={...schema.options,showCover:true,orientationPrompt:true};
schema.slides=schema.slides.slice(0,2);
await buildPresentationData(schema,process.cwd(),path.resolve('SHOWCASE/Begin.html'));
