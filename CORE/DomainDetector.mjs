const PROFILES={
  medical:['medical','clinical','patient','diagnosis','disease','treatment','medicine','hospital','physician','syndrome','case','grand rounds','hlh','mas','cancer','cardiac','neuro','immune'],
  science:['science','research','study','experiment','biology','physics','chemistry','mechanism','laboratory','method','results','lecture','scientific'],
  business:['business','market','strategy','company','product','customer','revenue','growth','investor','startup','traction','sales','kpi'],
  architecture:['architecture','architectural','building','tower','skyscraper','city','urban','structure','facade','portfolio','design studio','construction']
};

export class DomainDetector {
  detect(normalized={}){
    if(normalized.domain&&normalized.domain!=='auto') return {domain:normalized.domain,confidence:1,signals:['explicit']};
    const text=String(normalized.text||'');
    const scored=Object.entries(PROFILES).map(([domain,terms])=>{
      const signals=terms.filter(term=>text.includes(term));
      const score=signals.reduce((sum,term)=>sum+(term.includes(' ')?2:1),0);
      return {domain,score,signals};
    }).sort((a,b)=>b.score-a.score);
    const best=scored[0];
    if(!best||best.score===0) return {domain:'general',confidence:.35,signals:[]};
    const second=scored[1]?.score||0;
    return {domain:best.domain,confidence:Math.min(.99,.55+best.score*.06+(best.score-second)*.04),signals:best.signals};
  }
}
