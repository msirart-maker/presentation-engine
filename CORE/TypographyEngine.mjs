const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const words=value=>String(value||'').trim().split(/\s+/).filter(Boolean).length;
const items=data=>['cards','items','columns','references','images','charts','rows'].reduce((sum,key)=>sum+(data?.[key]?.length||0),0);

function measureSlide(slide){let wordCount=0,itemCount=0,longestTitle=0;for(const component of slide.components||[]){const data=component.data||{};wordCount+=words(data.title)+words(data.subtitle)+words(data.body);longestTitle=Math.max(longestTitle,words(data.title));itemCount+=items(data);for(const entry of data.cards||data.items||data.columns||[])wordCount+=words(entry.title)+words(entry.text)}const load=wordCount+itemCount*7+(slide.components?.length||0)*10;return{wordCount,itemCount,longestTitle,load}}

export class TypographyEngine {
  apply(schema={}){
    const clone=structuredClone(schema),plans=[];
    for(const slide of clone.slides||[]){const metrics=measureSlide(slide),requested=slide.density&&slide.density!=='auto'?slide.density:null,density=requested||(metrics.load>145?'compact':metrics.load<70?'airy':'balanced'),scale=clamp(1.07-(metrics.load-65)/520-(metrics.longestTitle>14?.04:0),.9,1.08),plan={slideId:slide.id,density,scale:Math.round(scale*1000)/1000,minBodyPx:density==='compact'?15:16,minCaptionPx:11,metrics,overflowRisk:metrics.load>180?'high':metrics.load>145?'medium':'low'};slide.className=[slide.className,`type-${density}`,`type-risk-${plan.overflowRisk}`].filter(Boolean).join(' ');slide.__typography=plan;plans.push(plan)}
    const averageScale=plans.reduce((sum,plan)=>sum+plan.scale,0)/Math.max(1,plans.length),counts=plans.reduce((map,plan)=>(map[plan.density]=(map[plan.density]||0)+1,map),{}),density=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'balanced';
    clone.theme=typeof clone.theme==='object'?clone.theme:{name:clone.theme||'v13.2'};clone.theme.typography={mode:'projector',density,scale:Math.round(averageScale*1000)/1000,minBodyPx:16,minCaptionPx:11,...(clone.theme.typography||{})};clone.theme.fonts={display:'"Fraunces", "Iowan Old Style", Georgia, serif',body:'Inter, ui-sans-serif, system-ui, sans-serif',mono:'"IBM Plex Mono", ui-monospace, monospace',...(clone.theme.fonts||{})};clone.__typography={version:'13.5.0',slides:plans,summary:{density,averageScale:clone.theme.typography.scale,highRisk:plans.filter(plan=>plan.overflowRisk==='high').length}};return clone;
  }
}
