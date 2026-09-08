/**
 * V11.8 safe closed-loop mutations.
 * Only changes schema properties that the production renderer already supports.
 * Content-requiring repairs remain recommendations rather than fabricated data.
 */
const ACCENTS=['ember','blue','gold','teal'];
const SURFACES=['light','card','dark','light'];
export class ClosedLoopDesigner {
  improve(schema={},critique={}){
    const next=typeof structuredClone==='function'?structuredClone(schema):JSON.parse(JSON.stringify(schema));
    const deferred=[];
    for(const issue of critique.issues||[]){
      const slide=next.slides?.[issue.slideIndex];if(!slide)continue;
      if(issue.type==='layout_repetition'){
        slide.surface=slide.surface||SURFACES[issue.slideIndex%SURFACES.length];
        slide.accent=slide.accent||ACCENTS[issue.slideIndex%ACCENTS.length];
        for(const component of slide.components||[])component.variation=component.variation||((issue.slideIndex%2)?'feature':'standard');
      }else if(issue.type==='information_density'){
        slide.density=slide.density==='compact'?'balanced':(slide.density||'balanced');
        deferred.push({slide:issue.slide,action:'content_split_or_simplify',reason:issue.message});
      }else{
        deferred.push({slide:issue.slide,action:issue.type,reason:issue.message});
      }
    }
    return {schema:next,deferred};
  }
}
