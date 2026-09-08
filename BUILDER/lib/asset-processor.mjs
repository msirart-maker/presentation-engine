import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {AssetRegistry} from '../../CORE/AssetRegistry.mjs';

const MIME={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.m4v':'video/x-m4v','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4'};
const isData=src=>/^data:/i.test(src||'');
const isRemote=src=>/^(https?:|\/\/)/i.test(src||'');
const isVolatile=src=>/^(blob:|#)/i.test(src||'');
const inside=(root,target)=>target===root||target.startsWith(`${root}${path.sep}`);

async function resolveAsset(src,baseDir,{embed=true,remote='warn',offlineRequired=false,rootReal}={}){
  if(!src)return{url:src,bytes:0,mime:'',embedded:false,sha256:null,sourceType:'empty'};
  if(isData(src))return{url:src,bytes:0,mime:String(src).match(/^data:([^;,]+)/i)?.[1]||'',embedded:true,sha256:null,sourceType:'data'};
  if(isRemote(src)||isVolatile(src)){
    if(offlineRequired||remote==='deny')throw new Error(`Remote or volatile asset is forbidden by asset policy: ${src}`);
    return{url:src,bytes:0,mime:'',embedded:false,sha256:null,sourceType:isRemote(src)?'remote':'volatile'};
  }
  const root=rootReal||await fs.realpath(baseDir),requested=path.resolve(baseDir,src),absolute=await fs.realpath(requested);
  if(!inside(root,absolute))throw new Error(`Local asset escapes the presentation root: ${src}`);
  const ext=path.extname(absolute).toLowerCase(),mime=MIME[ext];
  if(!mime)throw new Error(`Unsupported local asset type: ${src}`);
  let data;try{data=await fs.readFile(absolute)}catch(error){throw new Error(`Cannot read local asset ${src}: ${error.message}`)}
  return{url:embed?`data:${mime};base64,${data.toString('base64')}`:src,bytes:data.length,mime,embedded:embed,sha256:crypto.createHash('sha256').update(data).digest('hex'),sourceType:'local'};
}

export async function embedAsset(src,baseDir){return(await resolveAsset(src,baseDir)).url}

export async function processAssets(schema,baseDir){
  const clone=structuredClone(schema),registry=new AssetRegistry().collect(clone),cache=new Map(),policy={remote:'warn',offlineRequired:false,embedLocal:true,...(clone.assetPolicy||{})},rootReal=await fs.realpath(baseDir);
  const resolve=async(src,embed=policy.embedLocal)=>{const key=`${embed}:${src}`;if(!cache.has(key))cache.set(key,resolveAsset(src,baseDir,{embed,remote:policy.remote,offlineRequired:policy.offlineRequired,rootReal}));return cache.get(key)};
  for(const slide of clone.slides||[])for(const component of slide.components||[]){
    if(component.type==='ImageStoryCard')for(const item of component.data?.images||[])item.src=(await resolve(item.src)).url;
    if(component.type==='HeroScene'){
      if(component.data?.image?.src)component.data.image.src=(await resolve(component.data.image.src)).url;
      if(component.data?.video?.src)component.data.video.src=(await resolve(component.data.video.src)).url;
      if(component.data?.video?.poster)component.data.video.poster=(await resolve(component.data.video.poster)).url;
    }
  }
  const fontFaces=[],preloads=[],warnings=[],externalDependencies=[];let totalEmbeddedBytes=0;
  for(const record of registry){
    try{const result=await resolve(record.src,record.embed);record.status='ready';record.bytes=result.bytes;record.mime=result.mime;record.sha256=result.sha256;record.embedded=result.embedded;totalEmbeddedBytes+=result.embedded?result.bytes:0;
      record.sourceType=result.sourceType;if(!result.embedded&&['remote','volatile'].includes(result.sourceType)){externalDependencies.push({assetId:record.id,src:record.src,type:result.sourceType});if(policy.remote==='warn')warnings.push({severity:'warning',code:'EXTERNAL_ASSET_DEPENDENCY',assetId:record.id,message:`Asset remains externally dependent: ${record.src}`})}
      if(record.type==='font')fontFaces.push({family:record.family||`V13Font${fontFaces.length+1}`,weight:record.weight,style:record.style,mime:result.mime,src:result.url});
      if(record.preload&&['critical','high'].includes(record.priority)&&!result.embedded)preloads.push({src:result.url,type:record.type,mime:result.mime,crossorigin:record.type==='font'});
      if(result.bytes>8_000_000)warnings.push({severity:'warning',assetId:record.id,message:`Large asset is ${(result.bytes/1_000_000).toFixed(1)} MB; optimize before distribution.`});
    }catch(error){record.status='error';record.error=error.message;throw error}
  }
  if(totalEmbeddedBytes>25_000_000)warnings.push({severity:'warning',message:`Embedded assets total ${(totalEmbeddedBytes/1_000_000).toFixed(1)} MB; mobile viewers may become memory constrained.`});
  const nonEmbeddedLocal=registry.filter(record=>record.sourceType==='local'&&!record.embedded).map(record=>({assetId:record.id,src:record.src,type:'local-companion'})),dependencies=[...externalDependencies,...nonEmbeddedLocal],offlineComplete=dependencies.length===0;
  if(policy.offlineRequired&&!offlineComplete)throw new Error(`Offline asset policy failed: ${dependencies.length} asset dependency remains`);
  clone.__preloads=preloads;clone.__fontFaces=fontFaces;clone.__assetRegistry=registry;clone.__assetReview={version:'13.5.0',policy,singleFileHtml:true,offlineComplete,rootContained:true,assets:registry.length,embeddedBytes:totalEmbeddedBytes,externalDependencies:dependencies,warnings};return clone;
}
