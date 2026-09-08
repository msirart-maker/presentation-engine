const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,Number(value)||0));
const hue=value=>((Number(value)||0)%360+360)%360;
const byte=value=>Math.round(clamp(value)*255);
const hexByte=value=>byte(value).toString(16).padStart(2,'0');

export function rgbToHex({r,g,b}){return`#${hexByte(r)}${hexByte(g)}${hexByte(b)}`}

function parseHex(value){
  const raw=String(value||'').trim().replace(/^#/,'');
  if(!/^[0-9a-f]{3,8}$/i.test(raw)||![3,4,6,8].includes(raw.length))return null;
  const full=raw.length<=4?[...raw].map(char=>char+char).join(''):raw;
  return{r:parseInt(full.slice(0,2),16)/255,g:parseInt(full.slice(2,4),16)/255,b:parseInt(full.slice(4,6),16)/255,a:full.length===8?parseInt(full.slice(6,8),16)/255:1};
}

function parseRgb(value){
  const match=String(value||'').trim().match(/^rgba?\((.+)\)$/i);if(!match)return null;
  const body=match[1].replace(/\s*\/\s*/,',').split(/[\s,]+/).filter(Boolean);if(body.length<3)return null;
  const channel=part=>String(part).endsWith('%')?clamp(parseFloat(part)/100):clamp(parseFloat(part)/255);
  const alpha=part=>part===undefined?1:(String(part).endsWith('%')?clamp(parseFloat(part)/100):clamp(parseFloat(part)));
  const rgb={r:channel(body[0]),g:channel(body[1]),b:channel(body[2]),a:alpha(body[3])};
  return Object.values(rgb).every(Number.isFinite)?rgb:null;
}

function hslToRgb(h,s,l){
  h=hue(h)/360;s=clamp(s);l=clamp(l);
  if(s===0)return{r:l,g:l,b:l,a:1};
  const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;
  const channel=t=>{t=(t+1)%1;if(t<1/6)return p+(q-p)*6*t;if(t<.5)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p};
  return{r:channel(h+1/3),g:channel(h),b:channel(h-1/3),a:1};
}

function parseHsl(value){
  const match=String(value||'').trim().match(/^hsla?\((.+)\)$/i);if(!match)return null;
  const body=match[1].replace(/\s*\/\s*/,',').split(/[\s,]+/).filter(Boolean);if(body.length<3)return null;
  const h=parseFloat(body[0]),s=parseFloat(body[1])/100,l=parseFloat(body[2])/100;if(![h,s,l].every(Number.isFinite))return null;
  const rgb=hslToRgb(h,s,l);rgb.a=body[3]===undefined?1:clamp(String(body[3]).endsWith('%')?parseFloat(body[3])/100:parseFloat(body[3]));return rgb;
}

function linearToSrgb(value){return value<=.0031308?12.92*value:1.055*Math.pow(Math.max(0,value),1/2.4)-.055}
function srgbToLinear(value){return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4)}

export function oklchToRgb(L,C,H){
  const angle=hue(H)*Math.PI/180,a=C*Math.cos(angle),b=C*Math.sin(angle);
  const l_=L+.3963377774*a+.2158037573*b,m_=L-.1055613458*a-.0638541728*b,s_=L-.0894841775*a-1.291485548*b;
  const l=l_**3,m=m_**3,s=s_**3;
  return{r:clamp(linearToSrgb(4.0767416621*l-3.3077115913*m+.2309699292*s)),g:clamp(linearToSrgb(-1.2684380046*l+2.6097574011*m-.3413193965*s)),b:clamp(linearToSrgb(-.0041960863*l-.7034186147*m+1.707614701*s)),a:1};
}

export function rgbToOklch(rgb){
  const r=srgbToLinear(clamp(rgb.r)),g=srgbToLinear(clamp(rgb.g)),b=srgbToLinear(clamp(rgb.b));
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,bb=.0259040371*l+.7827717662*m-.808675766*s;
  const C=Math.sqrt(a*a+bb*bb),H=C<1e-7?0:hue(Math.atan2(bb,a)*180/Math.PI);return{l:L,c:C,h:H};
}

function parseOklch(value){
  const match=String(value||'').trim().match(/^oklch\((.+)\)$/i);if(!match)return null;
  const body=match[1].replace(/\s*\/\s*/,',').split(/[\s,]+/).filter(Boolean);if(body.length<3)return null;
  const l=String(body[0]).endsWith('%')?parseFloat(body[0])/100:parseFloat(body[0]),c=parseFloat(body[1]),h=parseFloat(body[2]);if(![l,c,h].every(Number.isFinite))return null;
  const rgb=oklchToRgb(clamp(l),Math.max(0,c),h);rgb.a=body[3]===undefined?1:clamp(String(body[3]).endsWith('%')?parseFloat(body[3])/100:parseFloat(body[3]));return rgb;
}

export function parseColor(value){
  const text=String(value||'').trim();
  if(text.startsWith('#'))return parseHex(text);
  if(/^rgba?\(/i.test(text))return parseRgb(text);
  if(/^hsla?\(/i.test(text))return parseHsl(text);
  if(/^oklch\(/i.test(text))return parseOklch(text);
  return null;
}

export function relativeLuminance(value){
  const rgb=typeof value==='string'?parseColor(value):value;if(!rgb)return null;
  const channels=[rgb.r,rgb.g,rgb.b].map(srgbToLinear);return.2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}

export function contrastRatio(a,b){const la=relativeLuminance(a),lb=relativeLuminance(b);return la===null||lb===null?null:(Math.max(la,lb)+.05)/(Math.min(la,lb)+.05)}

export function ensureContrast(color,background,minimum=4.5,fallback='#ffffff'){
  const source=parseColor(color),back=parseColor(background);if(!source||!back)return{color:fallback,ratio:contrastRatio(fallback,background)||0,verified:false};
  let candidate=rgbToOklch(source),output=rgbToHex(source),ratio=contrastRatio(output,background)||0;
  const target=relativeLuminance(back)<.42?.96:.12;
  for(let step=0;ratio<minimum&&step<24;step++){
    candidate={...candidate,l:candidate.l+(target-candidate.l)*.13,c:Math.max(.018,candidate.c*.96)};output=rgbToHex(oklchToRgb(candidate.l,candidate.c,candidate.h));ratio=contrastRatio(output,background)||0;
  }
  return{color:output,ratio,verified:ratio>=minimum};
}

export function normalizeColor(value,fallback='#6e86a6'){const parsed=parseColor(value);return parsed?rgbToHex(parsed):fallback}
export const colorMath=Object.freeze({clamp,hue});
