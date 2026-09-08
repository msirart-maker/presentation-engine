export class ContentSufficiencyError extends Error{
  constructor(message,assessment){super(message);this.name='ContentSufficiencyError';this.assessment=assessment}
}

export class ContentSufficiency{
  assess(inventory,requestedSlideCount=12,options={}){
    const requested=Math.max(1,Number(requestedSlideCount)||12),capacity=Math.max(1,inventory?.blocks?.length||0);
    const policy=options.policy||'adjust';
    const ratio=Math.round(capacity/requested*100)/100;
    let status='sufficient',selectedSlideCount=requested;
    const warnings=[];
    if(capacity<requested){
      status='insufficient';
      if(policy==='strict'){
        const assessment={status,policy,requestedSlideCount:requested,semanticCapacity:capacity,selectedSlideCount:capacity,ratio,warnings:[`Requested ${requested} slides but supplied content supports approximately ${capacity}.`]};
        throw new ContentSufficiencyError(assessment.warnings[0],assessment);
      }
      selectedSlideCount=capacity;
      warnings.push(`Slide count adjusted from ${requested} to ${capacity}; the request did not contain enough unique material to avoid padding.`);
    }else if(capacity>requested*2.25){status='overloaded';warnings.push(`${capacity-requested} content blocks will remain unused unless the presentation is expanded.`)}
    else if(capacity<requested*1.15){status='thin';warnings.push('Content capacity is close to the requested slide count; each slide should remain focused.')}
    return {version:'13.5.0',status,policy,requestedSlideCount:requested,semanticCapacity:capacity,selectedSlideCount,ratio,warnings};
  }
}

