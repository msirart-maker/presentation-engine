#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {UILibraryResolver} from '../CORE/UILibraryResolver.mjs';

const resolver=new UILibraryResolver(),[,,command='list',input]=process.argv;
if(command==='list'){
  const catalog=resolver.catalog();
  console.log(JSON.stringify({version:catalog.version,policy:catalog.policy,libraries:catalog.libraries.map(({id,label,category,framework,license,integration,capabilities})=>({id,label,category,framework,license,integration,capabilities}))},null,2));
}else if(command==='resolve'){
  if(!input)throw new Error('Usage: node BUILDER/ui-libraries.mjs resolve <presentation-schema.json>');
  const schema=JSON.parse(await fs.readFile(path.resolve(input),'utf8')),result=resolver.resolve(schema);console.log(JSON.stringify(result.review,null,2));
}else throw new Error(`Unknown UI library command: ${command}`);

export const uiLibraryCli=fileURLToPath(import.meta.url);
