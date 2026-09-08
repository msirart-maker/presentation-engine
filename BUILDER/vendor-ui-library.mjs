#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {UILibraryResolver} from '../CORE/UILibraryResolver.mjs';

const engineRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const safeRelative=value=>{const normalized=path.normalize(String(value||''));if(!value||path.isAbsolute(normalized)||normalized.startsWith('..')||normalized.includes(`${path.sep}..${path.sep}`))throw new Error(`Unsafe relative path: ${value}`);return normalized};

export async function vendorLibrary({library,packageRoot,version,licenseFile,assets,destinationRoot=path.join(engineRoot,'UI_LIBRARIES/vendor')}){
  const catalog=new UILibraryResolver().catalog(),entry=catalog.libraries.find(item=>item.id===library);
  if(!entry)throw new Error(`Unknown UI library: ${library}`);if(!entry.integration.includes('vendor'))throw new Error(`${entry.label} is recipe/advisor only and cannot be vendored by this bridge`);if(!catalog.policy.allowedLicenses.includes(entry.license))throw new Error(`License ${entry.license} is not allowed by engine policy`);
  if(!String(version||'').trim())throw new Error('A pinned library version is required');if(!Array.isArray(assets)||!assets.length)throw new Error('At least one CSS or JavaScript asset is required');
  const source=await fs.realpath(path.resolve(packageRoot)),target=path.join(destinationRoot,library),insideSource=resolved=>resolved===source||resolved.startsWith(`${source}${path.sep}`),readSource=async relative=>{const resolved=await fs.realpath(path.join(source,safeRelative(relative)));if(!insideSource(resolved))throw new Error(`Asset resolves outside package root: ${relative}`);return fs.readFile(resolved)};
  try{await fs.stat(target);throw new Error(`Vendor target already exists: ${target}. Remove or archive it explicitly before importing another version.`)}catch(error){if(error.code!=='ENOENT')throw error}
  const licenseRelative=safeRelative(licenseFile),licenseBytes=await readSource(licenseRelative),prepared=[];
  for(const asset of assets){const relative=safeRelative(asset.path),type=asset.type;if(!['css','js'].includes(type))throw new Error(`Unsupported asset type: ${type}`);const bytes=await readSource(relative),name=`${String(prepared.length+1).padStart(2,'0')}-${path.basename(relative)}`;prepared.push({bytes,record:{path:name,type,sha256:sha(bytes),sourcePath:relative}})}
  const copied=prepared.map(item=>item.record),manifest={schemaVersion:1,library,source:entry.source,package:entry.package,version:String(version).trim(),license:entry.license,licenseFile:'LICENSE',assets:copied,createdAt:new Date().toISOString()};
  await fs.mkdir(destinationRoot,{recursive:true});const stage=await fs.mkdtemp(path.join(destinationRoot,`.${library}-staging-`));
  try{await fs.writeFile(path.join(stage,'LICENSE'),licenseBytes);for(const item of prepared)await fs.writeFile(path.join(stage,item.record.path),item.bytes);await fs.writeFile(path.join(stage,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');await fs.rename(stage,target)}catch(error){await fs.rm(stage,{recursive:true,force:true});throw error}
  return{target,manifest};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),library=args.shift(),get=flag=>{const index=args.indexOf(flag);return index>=0?args[index+1]:null},packageRoot=get('--package-root'),version=get('--version'),licenseFile=get('--license'),assets=[];
  for(let index=0;index<args.length;index++)if(args[index]==='--asset'){const[type,...rest]=String(args[index+1]||'').split(':');assets.push({type,path:rest.join(':')});index++}
  if(!library||!packageRoot||!version||!licenseFile||!assets.length){console.error('Usage: node BUILDER/vendor-ui-library.mjs <library-id> --package-root <checked-out-or-extracted-package> --version <version> --license <relative-file> --asset css:<relative-file> [--asset js:<relative-file>]');process.exit(2)}
  vendorLibrary({library,packageRoot,version,licenseFile,assets}).then(result=>console.log(JSON.stringify({library,version,target:result.target,assets:result.manifest.assets.length},null,2))).catch(error=>{console.error(error.stack||error);process.exit(1)});
}
