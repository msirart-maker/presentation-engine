const PROFILES={
  medical:['patient','clinical','diagnosis','disease','treatment','medicine','hospital','physician','syndrome','hlh','mas','therapy','laboratory'],
  science:['research','experiment','biology','physics','chemistry','mechanism','method','results','scientific','hypothesis','data'],
  business:['market','company','product','customer','revenue','growth','investor','startup','traction','sales','strategy'],
  architecture:['building','tower','skyscraper','city','urban','structure','facade','construction','architecture','steel','elevator']
};
const contentText=request=>JSON.stringify({sections:request.sections||request.outline,facts:request.facts,timeline:request.timeline,charts:request.charts,comparisons:request.comparisons}).toLowerCase();

function detectContentDomain(request){
  const source=contentText(request),scores=Object.entries(PROFILES).map(([domain,terms])=>({domain,signals:terms.filter(term=>source.includes(term))})).map(item=>({...item,score:item.signals.length})).sort((a,b)=>b.score-a.score);
  return scores[0]?.score?{domain:scores[0].domain,score:scores[0].score,signals:scores[0].signals}:{domain:'general',score:0,signals:[]};
}

export class SemanticCritic{
  review({request={},plan,inventory,allocation,composition,sufficiency}={}){
    const findings=[];
    const explicit=String(request.domain||'auto').toLowerCase(),detected=detectContentDomain(request);
    if(explicit!=='auto'&&PROFILES[explicit]&&detected.domain!=='general'&&detected.domain!==explicit&&detected.score>=3)findings.push({type:'domain_inconsistency',severity:'high',message:`Request declares ${explicit}, but supplied content strongly resembles ${detected.domain} (${detected.signals.join(', ')}).`});
    if(sufficiency?.status==='insufficient')findings.push({type:'content_insufficient',severity:'medium',message:sufficiency.warnings[0]});
    const generic=[];
    for(const block of inventory?.blocks||[])if(/^(overview|development|meaning|application|point \d+|untitled presentation)$/i.test(block.title||''))generic.push(block.id);
    if(generic.length)findings.push({type:'generic_filler',severity:'high',message:`Generic content blocks detected: ${generic.join(', ')}.`});
    const unused=allocation?.coverage?.unusedUnits||[];
    if(unused.length)findings.push({type:'unused_content',severity:unused.length>(inventory?.units?.length||1)*.35?'medium':'low',message:`${unused.length} supplied content unit(s) were not selected.`,units:unused});
    if(composition?.metrics?.maximumConsecutive>2)findings.push({type:'composition_repetition',severity:'medium',message:`${composition.metrics.maximumConsecutive} identical compositions occur consecutively.`});
    const high=findings.filter(finding=>finding.severity==='high').length,medium=findings.filter(finding=>finding.severity==='medium').length,low=findings.filter(finding=>finding.severity==='low').length;
    return {passed:high===0,score:Math.max(0,100-high*20-medium*8-low*3),detectedContentDomain:detected,findings};
  }
}

