const array=value=>Array.isArray(value)?value:(value===undefined||value===null?[]:[value]);
const text=value=>String(value??'').trim();
const slug=value=>text(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'content';
const item=(value,index=0)=>typeof value==='string'
  ?{title:text(value),text:'',order:index}
  :{title:text(value?.title||value?.label||value?.heading||`Point ${index+1}`),text:text(value?.text||value?.summary||value?.body||value?.description),...value,order:index};

function uniqueId(base,seen){
  const clean=slug(base),next=(seen.get(clean)||0)+1;seen.set(clean,next);
  return next===1?clean:`${clean}-${next}`;
}

function visualsFor(kind,payload={}){
  if(kind==='timeline')return['Timeline'];
  if(kind==='chart')return['Charts'];
  if(kind==='comparison')return['ComparisonGrid'];
  if(kind==='images')return['ImageStoryCard'];
  if(kind==='ui-recipe'||payload.uiRecipe)return['UIRecipe'];
  if(kind==='references')return['ReferencePanel'];
  if(kind==='opening')return['HeroScene'];
  if(kind==='closing')return['ClosingScene'];
  const count=payload.items?.length||0;
  return count>=2?['GlassCard','ComparisonGrid']:['GlassCard','HeroScene'];
}

export class ContentInventory{
  build(request={}){
    const seen=new Map(),units=[],blocks=[];
    const addUnit=(base,data)=>{const unit={id:uniqueId(base,seen),priority:'primary',reusePolicy:'once',source:'request',...data};units.push(unit);return unit};
    const addBlock=(base,data)=>{const block={id:uniqueId(`block-${base}`,seen),order:blocks.length,priority:'primary',reusePolicy:'once',...data};block.visualPotential=block.visualPotential||visualsFor(block.kind,block);blocks.push(block);return block};
    const title=text(request.title||request.topic||'Untitled presentation');
    const description=text(request.description||request.brief);
    const opening=request.opening||request.content?.opening||{};
    const openingUnit=addUnit('opening',{kind:'opening',title:text(opening.title||title),text:text(opening.subtitle||description),priority:'essential',reusePolicy:'opening'});
    addBlock('opening',{kind:'opening',title:openingUnit.title,summary:openingUnit.text,payload:opening,sourceUnitIds:[openingUnit.id],priority:'essential',reusePolicy:'opening'});

    const sections=array(request.sections||request.outline||request.content?.sections);
    sections.forEach((raw,sectionIndex)=>{
      const section=typeof raw==='string'?{title:raw}:raw||{};
      const sectionTitle=text(section.title||section.heading||`Section ${sectionIndex+1}`);
      const summary=text(section.summary||section.description||section.body);
      const sectionId=uniqueId(`section-${sectionTitle}`,seen);
      const summaryUnit=addUnit(`${sectionId}-summary`,{kind:'section-summary',sectionId,title:sectionTitle,text:summary,priority:section.priority||'primary',reusePolicy:section.reusePolicy||'once',source:section.source||'request'});
      const points=array(section.items||section.bullets||section.points).map(item);
      const pointUnits=points.map((point,index)=>addUnit(`${sectionId}-point-${index+1}`,{kind:'point',sectionId,title:point.title,text:point.text,priority:point.priority||section.priority||'primary',reusePolicy:point.reusePolicy||'once',source:point.source||section.source||'request',payload:point}));
      const image=section.image||null,chart=section.chart||null,comparison=section.comparison||null,uiRecipe=section.uiRecipe||null;
      const first=section.composition?pointUnits:pointUnits.slice(0,2);
      addBlock(`${sectionId}-premise`,{kind:uiRecipe?'ui-recipe':'section',sectionId,title:sectionTitle,summary,items:first.map(unit=>({...unit.payload,title:unit.title,text:unit.text})),image,chart,comparison,uiRecipe,composition:section.composition,intent:section.intent,sourceUnitIds:[summaryUnit.id,...first.map(unit=>unit.id)],priority:summaryUnit.priority,reusePolicy:summaryUnit.reusePolicy});
      for(let index=section.composition?pointUnits.length:2;index<pointUnits.length;index+=2){
        const group=pointUnits.slice(index,index+2),lead=group[0];
        addBlock(`${sectionId}-detail-${index/2}`,{kind:'section-detail',intent:section.intent,sectionId,title:lead.title||`${sectionTitle}: Detail`,summary:lead.text,items:group.map(unit=>({...unit.payload,title:unit.title,text:unit.text})),sourceUnitIds:group.map(unit=>unit.id),priority:lead.priority,reusePolicy:lead.reusePolicy});
      }
    });

    const facts=array(request.facts||request.content?.facts).map(item);
    for(let index=0;index<facts.length;index+=3){
      const group=facts.slice(index,index+3),factUnits=group.map((fact,offset)=>addUnit(`fact-${index+offset+1}`,{kind:'fact',title:fact.title,text:fact.text,priority:fact.priority||'primary',reusePolicy:fact.reusePolicy||'once',source:fact.source||'request',payload:fact}));
      addBlock(`facts-${index/3+1}`,{kind:'facts',title:group[0]?.groupTitle||group[0]?.title||'Key evidence',summary:'',items:group,sourceUnitIds:factUnits.map(unit=>unit.id),priority:factUnits.some(unit=>unit.priority==='essential')?'essential':'primary'});
    }

    const timeline=array(request.timeline||request.content?.timeline).map(item);
    if(timeline.length){
      const timelineUnits=timeline.map((event,index)=>addUnit(`timeline-${index+1}`,{kind:'timeline-event',title:event.title,text:event.text,priority:event.priority||'primary',reusePolicy:event.reusePolicy||'once',source:event.source||'request',payload:event}));
      addBlock('timeline',{kind:'timeline',title:text(request.timelineTitle||'The sequence'),summary:text(request.timelineSummary),items:timeline,sourceUnitIds:timelineUnits.map(unit=>unit.id)});
    }

    array(request.charts||request.content?.charts).forEach((chart,index)=>{
      const unit=addUnit(`chart-${index+1}`,{kind:'chart',title:text(chart?.title||`Dataset ${index+1}`),text:text(chart?.insight||chart?.summary),priority:chart?.priority||'primary',reusePolicy:chart?.reusePolicy||'once',source:chart?.source||'request',payload:chart});
      addBlock(`chart-${index+1}`,{kind:'chart',title:unit.title,summary:unit.text,chart,sourceUnitIds:[unit.id],priority:unit.priority,reusePolicy:unit.reusePolicy});
    });

    array(request.comparisons||request.content?.comparisons).forEach((comparison,index)=>{
      const unit=addUnit(`comparison-${index+1}`,{kind:'comparison',title:text(comparison?.title||comparison?.leftTitle||`Comparison ${index+1}`),text:text(comparison?.conclusion),priority:comparison?.priority||'primary',reusePolicy:comparison?.reusePolicy||'once',source:comparison?.source||'request',payload:comparison});
      addBlock(`comparison-${index+1}`,{kind:'comparison',title:unit.title,summary:unit.text,comparison,sourceUnitIds:[unit.id],priority:unit.priority,reusePolicy:unit.reusePolicy});
    });

    const images=array(request.images||request.content?.images);
    for(let index=0;index<images.length;index+=4){
      const group=images.slice(index,index+4),imageUnits=group.map((image,offset)=>addUnit(`image-${index+offset+1}`,{kind:'image',title:text(image?.title||image?.alt||`Image ${index+offset+1}`),text:text(image?.caption),priority:image?.priority||'primary',reusePolicy:image?.reusePolicy||'once',source:image?.source||image?.url||'request',payload:image}));
      addBlock(`images-${index/4+1}`,{kind:'images',title:text(group[0]?.groupTitle||'Visual evidence'),summary:'',images:group,sourceUnitIds:imageUnits.map(unit=>unit.id)});
    }

    const references=array(request.references||request.content?.references);
    if(references.length){
      const referenceUnits=references.map((reference,index)=>addUnit(`reference-${index+1}`,{kind:'reference',title:text(reference?.title||reference?.citation||`Reference ${index+1}`),text:text(reference?.citation||reference?.text),priority:'supporting',reusePolicy:'reference',source:reference?.url||reference?.source||'request',payload:reference}));
      addBlock('references',{kind:'references',title:'References',summary:'Sources supporting the presentation.',references,sourceUnitIds:referenceUnits.map(unit=>unit.id),priority:'supporting',reusePolicy:'reference'});
    }

    const closing=request.closing||request.content?.closing||{};
    const closingUnit=addUnit('closing',{kind:'closing',title:text(closing.title||'Closing reflection'),text:text(closing.quote||closing.summary),priority:'essential',reusePolicy:'closing'});
    addBlock('closing',{kind:'closing',title:closingUnit.title,summary:closingUnit.text,payload:closing,sourceUnitIds:[closingUnit.id],priority:'essential',reusePolicy:'closing'});

    return {version:'13.5.0',title,units,blocks,summary:{units:units.length,blocks:blocks.length,sections:sections.length,bodyBlocks:blocks.filter(block=>!['opening','references','closing'].includes(block.kind)).length}};
  }
}
