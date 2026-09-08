import {parseColor,rgbToOklch,oklchToRgb,rgbToHex,ensureContrast,normalizeColor,colorMath} from './color.mjs';

const {clamp,hue}=colorMath;
const HARMONIES={
  analogous:[0,34,-34,68],complementary:[0,180,28,208],'split-complementary':[0,150,210,62],triadic:[0,120,240,60],monochrome:[0,0,0,0]
};
const SAFE={ember:'#d55e00',teal:'#009e73',gold:'#e6a700',blue:'#0072b2'};
const hex=(l,c,h)=>rgbToHex(oklchToRgb(clamp(l),Math.max(0,c),hue(h)));

function derived(seed,options={}){
  const source=parseColor(seed)||parseColor('#b65e4a'),base=rgbToOklch(source),harmony=HARMONIES[options.harmony]||HARMONIES.analogous;
  const chroma=clamp(options.chroma??Math.max(.08,Math.min(.19,base.c)),.035,.24),temperature=options.temperature||'balanced',temperatureShift=temperature==='warm'?12:temperature==='cool'?-12:0;
  const hues=harmony.map(offset=>base.h+offset+temperatureShift);
  const accents=options.colorBlindSafe?SAFE:{ember:hex(.57,chroma,hues[0]),teal:hex(.54,chroma*.78,hues[1]),gold:hex(.68,chroma*.78,hues[2]),blue:hex(.56,chroma*.72,hues[3])};
  return{
    'deep-1':hex(.105,Math.min(.045,chroma*.28),base.h),'deep-2':hex(.17,Math.min(.055,chroma*.34),base.h),'deep-3':hex(.255,Math.min(.07,chroma*.42),base.h),
    ink:hex(.19,.025,base.h),muted:hex(.49,.025,base.h),light:hex(.965,.014,base.h+20),card:hex(.992,.008,base.h+20),line:hex(.86,.018,base.h+20),
    ...accents,'ember-soft':hex(.82,chroma*.42,hues[0]),'teal-soft':hex(.82,chroma*.34,hues[1]),'gold-soft':hex(.82,chroma*.34,hues[2]),'blue-soft':hex(.82,chroma*.32,hues[3])
  };
}

export function composePalette({base={},palette={},fallback={}}={}){
  const mode=palette.mode||palette.harmony||palette.seed?'generated':'preset',seed=palette.seed||base.ember||fallback.ember||'#b65e4a';
  const generated=mode==='generated'?derived(seed,palette):{};
  const colors={...fallback,...generated,...base};
  const required=['deep-1','deep-2','deep-3','ink','muted','light','card','ember','ember-soft','teal','teal-soft','gold','gold-soft','blue','blue-soft','line'];
  for(const key of required)colors[key]=normalizeColor(colors[key],fallback[key]||generated[key]||'#6e86a6');
  const categorical=palette.colorBlindSafe?Object.values(SAFE):[colors.ember,colors.teal,colors.gold,colors.blue];
  return{colors,report:{mode,seed:normalizeColor(seed),harmony:palette.harmony||'preset',temperature:palette.temperature||'balanced',colorBlindSafe:Boolean(palette.colorBlindSafe),categorical}};
}

export function resolveAccentContrast(color,background,fallback){return ensureContrast(color,background,4.5,fallback)}
