const SPECIAL=new Set(['opening','references','closing']);
const priority=value=>({essential:0,primary:1,supporting:2}[value]??1);
const kindPriority=value=>({chart:0,timeline:0,comparison:0,images:0,facts:1,section:2,'section-detail':3}[value]??2);

function spreadSelect(blocks,count){
  if(count<=0)return[];
  if(blocks.length<=count)return blocks.slice();
  const selected=[],chosen=new Set();
  const sections=new Set();
  for(const block of blocks){
    if(selected.length>=count)break;
    if(block.sectionId&&!sections.has(block.sectionId)){selected.push(block);chosen.add(block.id);sections.add(block.sectionId)}
  }
  const remaining=blocks.filter(block=>!chosen.has(block.id)).sort((a,b)=>priority(a.priority)-priority(b.priority)||kindPriority(a.kind)-kindPriority(b.kind)||a.order-b.order);
  while(selected.length<count&&remaining.length){
    const slots=count-selected.length,index=Math.min(remaining.length-1,Math.floor((remaining.length-1)/Math.max(1,slots-1)*(count-selected.length===1?0:0)));
    selected.push(remaining.splice(index,1)[0]);
  }
  return selected.sort((a,b)=>a.order-b.order).slice(0,count);
}

export class NarrativeAllocator{
  allocate(plan,inventory,{slideCount}={}){
    const count=Math.max(1,slideCount||plan?.stages?.length||1),blocks=inventory?.blocks||[];
    const opening=blocks.find(block=>block.kind==='opening');
    const closing=blocks.find(block=>block.kind==='closing');
    const references=blocks.find(block=>block.kind==='references');
    const reserveOpening=count>1&&opening?1:0,reserveClosing=closing?1:0,reserveReferences=count>=3&&references?1:0;
    const bodySlots=Math.max(0,count-reserveOpening-reserveClosing-reserveReferences);
    const body=spreadSelect(blocks.filter(block=>!SPECIAL.has(block.kind)),bodySlots);
    const selected=[];
    if(reserveOpening)selected.push(opening);
    selected.push(...body);
    if(reserveReferences)selected.push(references);
    if(reserveClosing)selected.push(closing);
    while(selected.length<count){
      const fallback=blocks.find(block=>!selected.includes(block));
      if(!fallback)break;
      selected.splice(Math.max(0,selected.length-1),0,fallback);
    }
    const stages=plan.stages||[];
    const allocations=selected.slice(0,count).map((block,index)=>({
      index,slideNumber:index+1,stageId:stages[index]?.stageId||block.kind,stageInstanceId:stages[index]?.instanceId||`${block.kind}_${index+1}`,
      blockId:block.id,kind:block.kind,title:block.title,summary:block.summary||'',sourceUnitIds:block.sourceUnitIds||[],reusePolicy:block.reusePolicy||'once',block
    }));
    const usedUnits=new Set(allocations.flatMap(allocation=>allocation.sourceUnitIds));
    const unusedUnits=(inventory.units||[]).filter(unit=>!usedUnits.has(unit.id)&&!['opening','closing'].includes(unit.kind)).map(unit=>unit.id);
    return {version:'13.5.0',allocations,coverage:{usedUnits:usedUnits.size,totalUnits:inventory.units?.length||0,ratio:inventory.units?.length?Math.round(usedUnits.size/inventory.units.length*1000)/1000:1,unusedUnits}};
  }
}
