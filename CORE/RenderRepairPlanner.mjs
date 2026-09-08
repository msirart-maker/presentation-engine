const clone=value=>typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));

export class RenderRepairPlanner{
  repair(schema={},renderReport={},pass=1){
    const next=clone(schema),applied=[],deferred=[];
    for(const finding of renderReport.findings||[]){
      const index=Number.isInteger(finding.slideIndex)?finding.slideIndex:(next.slides||[]).findIndex(slide=>slide.id===finding.slideId);
      const slide=next.slides?.[index];if(!slide){deferred.push({...finding,reason:'slide_not_resolved'});continue}
      if(['horizontal_overflow','vertical_clipping','text_clipping','composition_overflow'].includes(finding.type)){
        slide.density='compact';
        if(slide.className?.includes('composition-split'))slide.className=slide.className.replace('composition-split','composition-single');
        for(const component of slide.components||[])if(component.variation==='cinema'||component.variation==='gallery')component.variation='editorial';
        applied.push({slide:index+1,type:finding.type,mutation:'compact density; collapse unsafe split composition; reduce media variation'});
      }else if(finding.type==='contrast'){
        slide.surface=['deep','dark','calm'].includes(slide.surface)?'deep':'light';slide.accent=slide.phase==='calm'?'teal':slide.phase==='storm'?'ember':'blue';
        applied.push({slide:index+1,type:finding.type,mutation:'restore phase-safe surface and semantic accent'});
      }else deferred.push({...finding,reason:'content_or_human_judgment_required'});
    }
    return {version:'13.5.0',pass,schema:next,applied,deferred,changed:applied.length>0};
  }
}

