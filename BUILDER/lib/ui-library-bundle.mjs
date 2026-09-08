import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const safeRelative=value=>{const normalized=path.normalize(String(value||''));if(path.isAbsolute(normalized)||normalized.startsWith('..')||normalized.includes(`${path.sep}..${path.sep}`))throw new Error(`Unsafe vendor asset path: ${value}`);return normalized};

export async function bundleUILibraries(review={},options={}){
  const vendorRoot=options.vendorRoot||path.join(root,'UI_LIBRARIES/vendor');
  const bundles=[],warnings=[];
  for(const selection of review.selections||[]){
    if(selection.mode!=='vendor')continue;
    let directory,manifest;
    try{directory=await fs.realpath(path.join(vendorRoot,selection.id));manifest=JSON.parse(await fs.readFile(path.join(directory,'manifest.json'),'utf8'))}catch(error){warnings.push({code:'VENDOR_MANIFEST_MISSING',library:selection.id,message:error.message});continue}
    const insideDirectory=resolved=>resolved===directory||resolved.startsWith(`${directory}${path.sep}`),readVendor=async relative=>{const resolved=await fs.realpath(path.join(directory,safeRelative(relative)));if(!insideDirectory(resolved))throw new Error(`Vendor asset resolves outside package: ${selection.id}/${relative}`);return fs.readFile(resolved)};
    if(manifest.library!==selection.id)throw new Error(`Vendor manifest library mismatch for ${selection.id}`);
    if(selection.license&&manifest.license!==selection.license)throw new Error(`Vendor license mismatch for ${selection.id}`);
    if(!manifest.version||!manifest.license||!manifest.licenseFile)throw new Error(`Vendor manifest for ${selection.id} requires version, license, and licenseFile`);
    if(!Array.isArray(manifest.assets)||!manifest.assets.length)throw new Error(`Vendor manifest for ${selection.id} has no assets`);
    const licenseText=(await readVendor(manifest.licenseFile)).toString('utf8'),assets=[];
    for(const asset of manifest.assets){const relative=safeRelative(asset.path),bytes=await readVendor(relative),actual=sha(bytes);if(actual!==asset.sha256)throw new Error(`Vendor hash mismatch for ${selection.id}/${relative}`);if(!['css','js'].includes(asset.type))throw new Error(`Unsupported vendor asset type: ${asset.type}`);assets.push({path:relative,type:asset.type,sha256:actual,content:bytes.toString('utf8')})}
    bundles.push({library:selection.id,version:manifest.version,license:manifest.license,licenseText,assets});
  }
  const css=bundles.flatMap(bundle=>bundle.assets.filter(asset=>asset.type==='css').map(asset=>`/* ${bundle.library} ${bundle.version} · ${bundle.license} · ${asset.path} */\n${asset.content}`)).join('\n'),js=bundles.flatMap(bundle=>bundle.assets.filter(asset=>asset.type==='js').map(asset=>`/* ${bundle.library} ${bundle.version} · ${bundle.license} · ${asset.path} */\n${asset.content}`)).join('\n');
  return{version:'13.5.0',bundles,css,js,warnings,thirdPartyCodeImported:bundles.length>0};
}
