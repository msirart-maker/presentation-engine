const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const words=value=>new Set(normalize(value).split(/\s+/).filter(Boolean));
const similarity=(a,b)=>{const aa=words(a),bb=words(b);if(!aa.size||!bb.size)return 0;let common=0;for(const token of aa)if(bb.has(token))common++;return common/Math.max(aa.size,bb.size)};

function visibleStrings(slide){
  const out=[];
  const add=(value,path)=>{const cleaned=String(value||'').trim();if(cleaned.length>=24&&cleaned.split(/\s+/).length>=4)out.push({value:cleaned,path})};
  for(const[ci,component]of(slide.components||[]).entries()){
    const data=component.data||{};
    for(const key of ['title','subtitle','body','quote','conclusion','note'])add(data[key],`components[${ci}].data.${key}`);
    for(const key of ['cards','items','columns'])for(const[ii,item]of(Array.isArray(data[key])?data[key]:[]).entries()){
      add(item?.title,`components[${ci}].data.${key}[${ii}].title`);add(item?.text,`components[${ci}].data.${key}[${ii}].text`);
    }
  }
  return out;
}

export class DuplicationGuard{
  inspect({schema,allocations=[]}={}){
    const findings=[],seenBlocks=new Map(),seenUnits=new Map();
    allocations.forEach(allocation=>{
      if(seenBlocks.has(allocation.blockId)&&allocation.reusePolicy==='once')findings.push({type:'block_reuse',severity:'high',slides:[seenBlocks.get(allocation.blockId)+1,allocation.index+1],message:`Content block ${allocation.blockId} was reused without permission.`});
      else seenBlocks.set(allocation.blockId,allocation.index);
      for(const id of allocation.sourceUnitIds||[]){if(seenUnits.has(id)&&allocation.reusePolicy==='once')findings.push({type:'unit_reuse',severity:'high',slides:[seenUnits.get(id)+1,allocation.index+1],message:`Content unit ${id} was reused without permission.`});else seenUnits.set(id,allocation.index)}
    });
    const strings=(schema?.slides||[]).map(visibleStrings);
    for(let left=0;left<strings.length;left++)for(let right=left+1;right<strings.length;right++)for(const a of strings[left])for(const b of strings[right]){
      if(normalize(a.value)===normalize(b.value))findings.push({type:'exact_visible_duplication',severity:'high',slides:[left+1,right+1],message:`Repeated visible content: “${a.value.slice(0,90)}”`});
      else if(a.value.split(/\s+/).length>=9&&b.value.split(/\s+/).length>=9&&similarity(a.value,b.value)>=.86)findings.push({type:'near_visible_duplication',severity:'medium',slides:[left+1,right+1],message:`Near-duplicate content appears on slides ${left+1} and ${right+1}.`});
    }
    const unique=new Map();for(const finding of findings){const key=`${finding.type}:${finding.slides?.join('-')}:${finding.message}`;unique.set(key,finding)}
    const result=[...unique.values()];
    return {passed:!result.some(finding=>finding.severity==='high'),score:Math.max(0,100-result.reduce((sum,finding)=>sum+(finding.severity==='high'?18:7),0)),findings:result};
  }
}
