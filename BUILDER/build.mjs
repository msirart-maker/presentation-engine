#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertValidPresentation} from './lib/schema-validator.mjs';
import {processAssets} from './lib/asset-processor.mjs';
import {renderSlide} from './lib/component-renderer.mjs';
import {cssBundle,runtimeBundle} from './lib/bundle.mjs';
import {escapeHtml,jsonForHtml} from './lib/html.mjs';
import {resolveDesign} from './lib/design-resolver.mjs';
import {PresentationDirector} from '../CORE/PresentationDirector.mjs';
import {ContentValidator} from '../CORE/ContentValidator.mjs';
import {TypographyEngine} from '../CORE/TypographyEngine.mjs';
import {ResponsiveLayoutResolver} from '../CORE/ResponsiveLayoutResolver.mjs';
import {ContentFitter} from '../CORE/ContentFitter.mjs';
import {UILibraryResolver} from '../CORE/UILibraryResolver.mjs';
import {bundleUILibraries} from './lib/ui-library-bundle.mjs';

function themeCss(theme){
  if(!theme || typeof theme==='string') return '';
  const colors=Object.entries(theme.colors||{}).map(([key,value])=>`--v10-${key.replace(/[^A-Za-z0-9_-]/g,'')}:${value};`).join('');
  const fonts=theme.fonts||{};
  const typography=theme.typography||{};
  return `:root{${colors}${fonts.display?`--v10-display:${fonts.display};`:''}${fonts.body?`--v10-body:${fonts.body};`:''}${fonts.mono?`--v10-mono:${fonts.mono};`:''}${theme.radius?`--v10-radius:${theme.radius};`:''}${theme.shadow?`--v10-shadow:${theme.shadow};`:''}${typography.scale?`--v13-type-scale:${typography.scale};`:''}}`;
}

function assetCss(prepared){
  return(prepared.__fontFaces||[]).map(face=>{const family=String(face.family||'V13Font').replace(/["\\]/g,'');const src=String(face.src||'').replace(/["\\\n\r]/g,'');const format=face.mime?.split('/')[1]||'';return `@font-face{font-family:"${family}";src:url("${src}")${format?` format("${format}")`:''};font-weight:${face.weight||400};font-style:${face.style||'normal'};font-display:swap;}`}).join('\n');
}

export async function buildPresentationData(inputSchema,baseDir,outputPath,buildOptions={}){
  let schema=typeof structuredClone==='function'?structuredClone(inputSchema):JSON.parse(JSON.stringify(inputSchema));
  const fitting=new ContentFitter().apply(schema,{mode:buildOptions.contentFit||schema.options?.contentFit||'preserve'});
  schema=fitting.schema;
  const director=new PresentationDirector();
  schema=director.plan(schema,{plan:buildOptions.plan});
  const initialReview=director.critique(schema);
  if(buildOptions.adaptive!==false&&schema.design?.mode!=='manual')schema=director.adaptiveImprove(schema);
  const finalReview=director.critique(schema);
  const intelligenceReview={initial:initialReview,final:finalReview,repairs:director.repairPlan()};
  assertValidPresentation(schema);
  const contentReview=new ContentValidator().assert(schema);
  const productionPlan=director.getLastPlan();
  schema=new TypographyEngine().apply(schema);
  schema=new ResponsiveLayoutResolver().apply(schema);
  const designed=resolveDesign(schema),uiResolution=new UILibraryResolver().resolve(designed),uiBundle=await bundleUILibraries(uiResolution.review);
  const prepared=await processAssets(uiResolution.schema,baseDir);
  const options={showCover:true,showCounter:true,showProgress:true,showNavigation:true,showReplay:true,showFullscreen:true,orientationPrompt:true,snap:'proximity',rememberSession:false,...prepared.options};
  const slides=prepared.slides.map(renderSlide).join('\n');
  const css=((await cssBundle())+'\n'+assetCss(prepared)+'\n'+themeCss(prepared.theme)+'\n'+uiBundle.css).replace(/<\/style/gi,'<\\/style');
  const runtime=(uiBundle.js+'\n'+await runtimeBundle()).replace(/<\/script/gi,'<\\/script');
  const preloads=(prepared.__preloads||[]).map(item=>`<link rel="preload" as="${escapeHtml(item.type||'image')}" href="${escapeHtml(item.src)}"${item.mime?` type="${escapeHtml(item.mime)}"`:''}${item.crossorigin?' crossorigin="anonymous"':''}>`).join('');
  const html=`<!doctype html>
<html lang="${escapeHtml(prepared.lang||'en')}" data-v10-snap="${options.snap}" data-v10-density="${escapeHtml(prepared.__design?.density||prepared.theme?.density||'balanced')}" data-v10-design-mood="${escapeHtml(prepared.__design?.mood||'cinematic')}" data-v13-style-pack="${escapeHtml(prepared.__design?.stylePack||'cinematic-glass')}" data-v13-motion="${escapeHtml(prepared.__design?.motion||'cinematic')}" data-v13-ui-libraries="${escapeHtml((uiResolution.review.selections||[]).map(item=>item.id).join(' '))}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark light"><title>${escapeHtml(prepared.title)}</title>${preloads}<style>${css}</style></head>
<body>
<noscript><style>#v10-cover,#v10-navigation,#v10-replay,#v10-fullscreen,#v10-counter,#v10-progress{display:none!important}#v10-stage{height:auto!important;overflow:visible!important}.v10-slide{height:auto!important;min-height:100vh;overflow:visible!important}</style><p>This viewer shows the reading version. Open in a browser with JavaScript for interactive slides.</p></noscript>
<a class="v10-skip" href="#v10-stage">Skip to presentation</a>
<div id="v10-app" data-v10-options='${jsonForHtml(options)}'>
  <div id="v10-progress" aria-hidden="true"><i></i></div>
  <div id="v10-counter" aria-live="polite"><span>01</span> / <b>${String(prepared.slides.length).padStart(2,'0')}</b></div>
  <button id="v10-fullscreen" class="v10-control" type="button">Full screen</button>
  <nav id="v10-navigation" aria-label="Slide controls"><button type="button" data-v10-nav="prev" aria-label="Previous slide">↑</button><button type="button" data-v10-nav="next" aria-label="Next slide">↓</button></nav>
  <button id="v10-replay" class="v10-control" type="button" aria-label="Replay slide"><span>↻</span><b>Replay</b></button>
  <main id="v10-stage" tabindex="-1">${slides}</main>
  <div id="v10-cover" class="${options.showCover?'':'is-hidden'}"><div class="v10-cover-inner"><span>Presentation</span><h1>${escapeHtml(prepared.title)}</h1><p>${escapeHtml(prepared.description||'A professionally composed HTML presentation')}</p><button id="v10-begin" type="button">Begin presentation <i>→</i></button></div></div>
  <div id="v10-loader" aria-hidden="true"><div><i></i><strong>Adapting view</strong><span>Preparing presentation</span></div></div>
  <div id="v10-orientation" role="dialog" aria-modal="true" aria-hidden="true"><button type="button" data-v10-dismiss aria-label="Close">×</button><div class="v10-phone"><i></i></div><h2>Landscape is recommended</h2><p>You can continue in portrait; the presentation remains fully usable.</p><button type="button" data-v10-dismiss>Continue anyway</button></div>
  <div id="v10-lightbox" role="dialog" aria-modal="true" aria-hidden="true"><button type="button" data-v10-lightbox-close aria-label="Close image">×</button><div><img alt=""><section><h2></h2><p></p><a target="_blank" rel="noopener noreferrer">Open source ↗</a></section></div></div>
</div>
<script id="v10-schema" type="application/json">${jsonForHtml(schema)}</script>
<script id="v11-production-plan" type="application/json">${jsonForHtml(productionPlan||{})}</script>
<script id="v11-intelligence-review" type="application/json">${jsonForHtml(intelligenceReview||{})}</script>
<script id="v13-content-review" type="application/json">${jsonForHtml(contentReview||{})}</script>
<script id="v13-content-fit" type="application/json">${jsonForHtml(fitting.report)}</script>
<script id="v13-asset-registry" type="application/json">${jsonForHtml(prepared.__assetRegistry||[])}</script>
<script id="v13-asset-review" type="application/json">${jsonForHtml(prepared.__assetReview||{})}</script>
<script id="v13-responsive-plan" type="application/json">${jsonForHtml(prepared.__responsive||{})}</script>
<script id="v13-typography-plan" type="application/json">${jsonForHtml(prepared.__typography||{})}</script>
<script id="v13-resolved-design" type="application/json">${jsonForHtml(prepared.__design||{})}</script>
<script id="v13-ui-library-review" type="application/json">${jsonForHtml(uiResolution.review)}</script>
<script id="v13-third-party-licenses" type="application/json">${jsonForHtml(uiBundle.bundles.map(bundle=>({library:bundle.library,version:bundle.version,license:bundle.license,text:bundle.licenseText})))}</script>
<script>${runtime}</script>
</body></html>`;
  const absoluteOutput=path.resolve(outputPath);
  await fs.mkdir(path.dirname(absoluteOutput),{recursive:true});
  await fs.writeFile(absoluteOutput,html);
  const embeddedAssetBytes=[...html.matchAll(/data:[^;\s"']+;base64,[A-Za-z0-9+/=]+/g)].reduce((sum,match)=>sum+Buffer.byteLength(match[0]),0);
  return {embeddedAssetBytes,output:absoluteOutput,slides:prepared.slides.length,bytes:Buffer.byteLength(html),plan:productionPlan,review:intelligenceReview,contentReview,contentFit:fitting.report,assetReview:prepared.__assetReview||{},responsivePlan:prepared.__responsive||{},design:prepared.__design||{},uiLibraryReview:{...uiResolution.review,vendorWarnings:uiBundle.warnings,thirdPartyCodeImported:uiBundle.thirdPartyCodeImported}};
}

export async function buildPresentation(inputPath,outputPath,buildOptions={}){
  const absoluteInput=path.resolve(inputPath);
  const schema=JSON.parse(await fs.readFile(absoluteInput,'utf8'));
  const result=await buildPresentationData(schema,path.dirname(absoluteInput),outputPath,buildOptions);
  return {input:absoluteInput,...result};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const [, , input, output] = process.argv;
  if(!input || !output){ console.error('Usage: node BUILDER/build.mjs <schema.json> <output.html>'); process.exit(2); }
  try{ const result=await buildPresentation(input,output); console.log(`Built ${result.slides} slides → ${result.output} (${result.bytes.toLocaleString()} bytes)`); }
  catch(error){ console.error(error.stack||error.message); process.exit(1); }
}
