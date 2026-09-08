import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {composePalette,resolveAccentContrast} from './palette-composer.mjs';

const catalog=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../DESIGN_SYSTEM/style-packs.json',import.meta.url)),'utf8'));
const PACKS=new Map(catalog.packs.map(pack=>[pack.id,pack]));
const ALIASES=new Map(catalog.packs.flatMap(pack=>[pack.id,...(pack.aliases||[])].map(alias=>[alias,pack.id])));
const TONES=['ember','teal','gold','blue'];
const AUTO_VARIATIONS=new Set(['auto','standard','cinematic','feature','grid','cinema','gallery','rail','focus','comparison','versus','matrix','editorial','minimal','sequence','media','split']);
const safeClone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
const text=value=>String(value||'').toLowerCase();

function inferMood(schema){
  const source=text(`${schema.title} ${schema.description}`);
  if(/clinical|medical|patient|health|laboratory|diagnos/.test(source))return'clinical';
  if(/tower|city|building|architecture|skyscraper|engineering/.test(source))return'architectural';
  if(/nature|ocean|forest|earth|animal|wild|calm/.test(source))return'nature';
  if(/technology|future|digital|space|quantum|cyber|network/.test(source))return'futuristic';
  if(/portrait|culture|fashion|art|story|breed|history|editorial/.test(source))return'editorial';
  return'cinematic';
}

function inferPack(schema,mood){
  const source=text(`${schema.title} ${schema.description} ${schema.audience||''}`);
  if(/bauhaus|geometric|primary shapes/.test(source))return'bauhaus-geometric';
  if(/brutalist|brutalism|raw poster/.test(source))return'neo-brutalist';
  if(/luxury|premium|minimal elegance|fashion house/.test(source))return'luxury-minimal';
  if(/scientific|research|technical|engineering lecture|data intensive/.test(source))return'scientific-technical';
  if(/swiss|editorial|magazine|international typographic/.test(source))return'swiss-editorial';
  return({architectural:'swiss-editorial',editorial:'swiss-editorial',nature:'organic-nature',futuristic:'futuristic-hud',clinical:'scientific-technical',cinematic:'cinematic-glass'}[mood]||catalog.default);
}

function getPack(requested,schema,mood){
  const normalized=ALIASES.get(text(requested).trim())||requested;
  return PACKS.get(normalized)||PACKS.get(inferPack(schema,mood))||PACKS.get(catalog.default);
}

function semanticTone(value,phase='neutral',index=0,strategy='semantic'){
  if(strategy==='monochrome')return phase==='calm'?'teal':'ember';
  if(strategy==='alternating')return TONES[index%TONES.length];
  const source=text(value);
  if(/recover|calm|improv|success|safe|resolve|positive|restore|growth|stable/.test(source))return'teal';
  if(/risk|warning|danger|declin|fail|storm|critical|loss|problem|urgent/.test(source))return'ember';
  if(/peak|key|priority|highlight|award|value|opportunity/.test(source))return'gold';
  if(/data|evidence|context|history|baseline|reference|system|method/.test(source))return'blue';
  if(phase==='calm')return index%3?'teal':'gold';
  if(phase==='storm')return index%3?'blue':'ember';
  return TONES[index%TONES.length];
}

function slideComplexity(slide){
  let score=0;
  for(const component of slide.components||[]){
    const data=component.data||{};
    score+=text(data.title).length/45+text(data.subtitle).length/110+text(data.body).length/180;
    for(const key of ['cards','images','items','charts','columns','references'])score+=(data[key]?.length||0)*(key==='references'?.72:1);
    score+=(data.note?1:0)+(data.conclusion?1:0);
  }
  return Math.round(score*10)/10;
}

function densityFor(score,requested='auto'){if(['airy','balanced','compact'].includes(requested))return requested;return score>=7?'compact':score<=3?'airy':'balanced'}

function surfaceFor(slide,index,packId){
  if(slide.surface)return slide.surface;
  if(slide.phase==='calm')return packId==='organic-nature'?'light':'calm';
  const hasChart=slide.components?.some(component=>component.type==='Charts');
  if(packId==='swiss-editorial')return index%4===0?'deep':index%2?'card':'light';
  if(packId==='bauhaus-geometric')return index%3===0?'deep':index%2?'card':'light';
  if(packId==='luxury-minimal')return index%4===0?'deep':'light';
  if(packId==='neo-brutalist')return index%3===0?'dark':index%2?'card':'light';
  if(packId==='scientific-technical')return hasChart?'dark':index%2?'card':'light';
  if(packId==='organic-nature')return index%4===0?'calm':index%2?'card':'light';
  if(packId==='futuristic-hud')return index%3===1?'dark':'deep';
  if(slide.phase==='storm')return hasChart||index%2?'dark':'deep';
  return slide.components?.some(component=>['ImageStoryCard','GlassCard'].includes(component.type))&&index%2?'card':'light';
}

function variationFor(component,packId){
  const data=component.data||{};let base='standard';
  if(component.type==='HeroScene')base=data.image?'media':text(data.body).length<80?'minimal':'split';
  else if(component.type==='GlassCard')base=(data.cards?.length||0)<=2?'feature':'grid';
  else if(component.type==='ImageStoryCard')base=(data.images?.length||0)===1?'cinema':(data.images?.length||0)===2?'editorial':'gallery';
  else if(component.type==='Charts')base=(data.charts?.length||1)===1?'focus':'comparison';
  else if(component.type==='Timeline')base=(data.items?.length||0)<=4?'rail':'sequence';
  else if(component.type==='ComparisonGrid')base=(data.columns?.length||0)===2?'versus':'matrix';
  else if(component.type==='ClosingScene')base='minimal';
  else if(component.type==='UIRecipe')base=data.pattern||'feature-grid';
  if(component.variation&&!AUTO_VARIATIONS.has(component.variation))return component.variation;
  const family={
    'swiss-editorial':{HeroScene:'editorial',GlassCard:'editorial-grid',ClosingScene:'editorial'},
    'bauhaus-geometric':{HeroScene:'geometric',GlassCard:'geometric-grid',ComparisonGrid:'geometric',ClosingScene:'geometric'},
    'luxury-minimal':{HeroScene:'minimal',GlassCard:'luxury-grid',ClosingScene:'minimal'},
    'neo-brutalist':{HeroScene:'poster',GlassCard:'brutal-grid',ComparisonGrid:'brutal',ClosingScene:'poster'},
    'scientific-technical':{HeroScene:'technical',GlassCard:'technical-grid',Charts:'technical',Timeline:'technical',UIRecipe:'technical-ui'},
    'organic-nature':{HeroScene:'organic',GlassCard:'organic-grid',ImageStoryCard:'organic',ClosingScene:'organic'},
    'futuristic-hud':{HeroScene:'hud',GlassCard:'hud-grid',Charts:'hud',Timeline:'hud',ClosingScene:'hud'}
  }[packId]?.[component.type];
  return family||base;
}

function applyCardTones(component,phase,strategy){if(component.type==='GlassCard')(component.data?.cards||[]).forEach((card,index)=>{if(!card.tone)card.tone=semanticTone(`${card.eyebrow} ${card.title} ${card.text}`,phase,index,strategy)})}

function adaptMotion(animations,profile){
  const config={
    none:{factor:0,easing:'linear'},
    restrained:{heroSequence:'fade',fadeUp:'fade',slideLeft:'fade',slideRight:'fade',blur:'fade',scale:'fade',factor:.5},
    standard:{factor:1},
    editorial:{heroSequence:'slideLeft',fadeUp:'fade',scale:'fade',factor:.82,easing:'cubic-bezier(.25,.7,.25,1)'},
    geometric:{heroSequence:'scale',fadeUp:'slideRight',blur:'scale',factor:.78,easing:'cubic-bezier(.18,.8,.28,1)'},
    luxury:{heroSequence:'blur',fadeUp:'fade',slideLeft:'fade',slideRight:'fade',factor:1.18,easing:'cubic-bezier(.16,.78,.2,1)'},
    brutal:{heroSequence:'slideLeft',fadeUp:'slideRight',blur:'scale',factor:.66,easing:'steps(8,end)'},
    technical:{heroSequence:'fadeUp',fadeUp:'slideLeft',scale:'fade',factor:.78,easing:'cubic-bezier(.2,.65,.2,1)'},
    organic:{heroSequence:'fadeUp',slideLeft:'fadeUp',slideRight:'fadeUp',factor:1.08,easing:'cubic-bezier(.22,.74,.16,1)'},
    hud:{heroSequence:'blur',fadeUp:'slideRight',slideLeft:'blur',factor:.72,easing:'cubic-bezier(.16,.84,.28,1)'},
    cinematic:{factor:1,easing:'cubic-bezier(.2,.75,.2,1)'}
  }[profile]||{factor:1};
  return(animations||[]).map(animation=>{
    if(['countUp','chartDraw','particles','stagger'].includes(animation.type))return{...animation,duration:Math.round((animation.duration||900)*config.factor),easing:animation.easing||config.easing};
    return{...animation,type:config[animation.type]||animation.type,duration:Math.round((animation.duration||900)*config.factor),easing:animation.easing||config.easing};
  });
}

export function resolveDesign(schema){
  const resolved=safeClone(schema),request=resolved.design||{},automatic=request.mode!=='manual';
  const mood=request.mood&&request.mood!=='auto'?request.mood:(automatic?inferMood(resolved):'cinematic'),pack=getPack(request.stylePack||request.pack,resolved,mood);
  const existing=resolved.theme&&typeof resolved.theme==='object'?resolved.theme:{name:typeof resolved.theme==='string'?resolved.theme:pack.id};
  const densityRequest=request.density||existing.density||(automatic?'auto':'balanced'),strategy=request.accentStrategy||(automatic?'semantic':'alternating');
  const paletteResult=composePalette({base:existing.colors||{},palette:request.palette||{},fallback:pack.palette});
  resolved.theme={name:existing.name||pack.id,...existing,colors:paletteResult.colors,fonts:{...pack.typography,...(existing.fonts||{})},radius:existing.radius||pack.geometry.radius,shadow:existing.shadow||pack.geometry.shadow};
  const palette=resolved.theme.colors;
  const motion=request.motion||pack.motion;
  resolved.slides=(resolved.slides||[]).map((slide,index)=>{
    const complexity=slideComplexity(slide),density=automatic?densityFor(complexity,slide.density||densityRequest):(slide.density&&slide.density!=='auto'?slide.density:'balanced');
    const tone=slide.accent||(automatic?semanticTone(`${slide.ariaLabel||''} ${(slide.components||[]).map(c=>`${c.data?.kicker||''} ${c.data?.title||''}`).join(' ')}`,slide.phase,index,strategy):(slide.phase==='calm'?'teal':slide.phase==='storm'?'ember':'blue'));
    const resolvedSurface=automatic?surfaceFor(slide,index,pack.id):(slide.surface||(slide.phase==='storm'?'deep':slide.phase==='calm'?'calm':'light')),dark=['deep','dark','calm'].includes(resolvedSurface);
    const background=dark?palette['deep-1']:palette.light,preferred=dark?(palette[`${tone}-soft`]||palette[tone]):palette[tone],contrast=resolveAccentContrast(preferred,background,dark?'#ffffff':'#111111');
    const components=(slide.components||[]).map(component=>{const next={...component,variation:automatic?variationFor(component,pack.id):(component.variation||'standard'),data:safeClone(component.data||{})};if(automatic)applyCardTones(next,slide.phase,strategy);return next});
    return{...slide,surface:resolvedSurface,density,accent:tone,animations:automatic?adaptMotion(slide.animations,motion):slide.animations,design:{...(slide.design||{}),complexity,tone,accent:contrast.color,accentSoft:palette[`${tone}-soft`]||contrast.color,contrast:Math.round(contrast.ratio*100)/100,contrastVerified:contrast.verified,dark,stylePack:pack.id,motion},components};
  });
  resolved.__design={mode:request.mode||'auto',mood,stylePack:pack.id,styleLabel:pack.label,motion,strategy,density:densityRequest,palette:paletteResult.report,colors:resolved.theme.colors};
  return resolved;
}

export const DESIGN_PRESETS=Object.freeze(catalog.packs.map(pack=>pack.id));
export const DESIGN_PACKS=Object.freeze(catalog.packs.map(pack=>({id:pack.id,label:pack.label,motion:pack.motion})));
