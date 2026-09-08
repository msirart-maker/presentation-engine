/**
 * V11.8 deterministic presentation critic.
 * Reviews only facts measurable from the schema; it never invents image or layout content.
 */
const VISUAL_TYPES=new Set(['HeroScene','ImageStoryCard','Charts','Timeline','ComparisonGrid']);
const dataWeight=data=>['cards','images','items','charts','columns','references'].reduce((n,key)=>n+(data?.[key]?.length||0),0);
const titleOf=slide=>(slide.components||[]).map(c=>c.data?.title||'').find(Boolean)||'';
const signature=slide=>(slide.components||[]).map(c=>c.type).join('+');

export class PresentationCritic {
  review(schema={}){
    const issues=[];
    const slides=schema.slides||[];
    let repeated=1;
    slides.forEach((slide,index)=>{
      const components=slide.components||[];
      const payload=JSON.stringify(components);
      const weight=components.reduce((n,c)=>n+dataWeight(c.data),0);
      const visual=components.some(c=>VISUAL_TYPES.has(c.type));
      const title=titleOf(slide);
      if(payload.length>5200||weight>12)issues.push({slide:index+1,slideIndex:index,type:'information_density',severity:'medium',message:'High content density; consider splitting or simplifying the slide.'});
      if(title.length>115)issues.push({slide:index+1,slideIndex:index,type:'long_title',severity:'low',message:'Title is unusually long for a projected slide.'});
      if(!visual&&payload.length>1800)issues.push({slide:index+1,slideIndex:index,type:'missing_visual_anchor',severity:'low',message:'Dense slide has no chart, timeline, image, comparison, or hero visual anchor.'});
      if(index>0&&signature(slide)===signature(slides[index-1]))repeated++;else repeated=1;
      if(repeated>=3)issues.push({slide:index+1,slideIndex:index,type:'layout_repetition',severity:'low',message:`${repeated} consecutive slides use the same component signature (${signature(slide)}).`});
    });
    return {passed:!issues.some(i=>i.severity==='high'),score:Math.max(0,100-issues.reduce((n,i)=>n+({high:18,medium:8,low:4}[i.severity]||4),0)),issues,findings:issues};
  }
}
