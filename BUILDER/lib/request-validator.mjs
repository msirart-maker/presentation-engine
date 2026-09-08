const problem=(path,message)=>`${path}: ${message}`;
const arrays=['sections','outline','facts','timeline','charts','comparisons','images','references'];
const TOP_LEVEL=new Set(['title','topic','description','brief','audience','domain','intent','presentationType','type','slideCount','durationSlides','sections','outline','facts','timeline','timelineTitle','timelineSummary','charts','comparisons','images','references','opening','closing','content','theme','design','options','assetPolicy','uiLibraries','generation','intake','contentPolicy','mood','accentStrategy','density','presenter','lang','tags']);

export function validateGenerationRequest(request){
  const errors=[];
  if(!request||typeof request!=='object'||Array.isArray(request))return{valid:false,errors:[problem('$','must be an object')]};
  for(const key of Object.keys(request))if(!TOP_LEVEL.has(key))errors.push(problem(`$.${key}`,'unknown generation-request property'));
  if(request.options?.transition&&!['none','fade','slide'].includes(request.options.transition))errors.push(problem('$.options.transition','must be none, fade, or slide'));
  const title=request.title||request.topic;
  if(typeof title!=='string'||!title.trim())errors.push(problem('$.title','title or topic must be a non-empty string'));
  if(request.slideCount!==undefined&&(!Number.isInteger(request.slideCount)||request.slideCount<1||request.slideCount>60))errors.push(problem('$.slideCount','must be an integer from 1 to 60'));
  for(const key of arrays)if(request[key]!==undefined&&!Array.isArray(request[key]))errors.push(problem(`$.${key}`,'must be an array'));
  for(const[index,section]of(request.sections||request.outline||request.content?.sections||[]).entries()){
    if(typeof section==='string'){if(!section.trim())errors.push(problem(`$.sections[${index}]`,'must not be empty'));continue}
    if(!section||typeof section!=='object'||Array.isArray(section))errors.push(problem(`$.sections[${index}]`,'must be a string or object'));
    else{
      if(typeof(section.title||section.heading)!=='string'||!(section.title||section.heading).trim())errors.push(problem(`$.sections[${index}].title`,'requires a non-empty title or heading'));
      const items=section.items||section.bullets||section.points;if(items!==undefined&&!Array.isArray(items))errors.push(problem(`$.sections[${index}].items`,'must be an array'));
    }
  }
  for(const[index,chart]of(request.charts||request.content?.charts||[]).entries()){
    if(!chart||typeof chart!=='object')errors.push(problem(`$.charts[${index}]`,'must be an object'));
    else{
      const hasValues=Array.isArray(chart.values)&&chart.values.length>0,hasSeries=Array.isArray(chart.series)&&chart.series.some(series=>Array.isArray(series.values)&&series.values.length),hasPoints=Array.isArray(chart.points)&&chart.points.length>0,hasMatrix=Array.isArray(chart.matrix)&&chart.matrix.length>0;
      if(!hasValues&&!hasSeries&&!hasPoints&&!hasMatrix)errors.push(problem(`$.charts[${index}]`,'requires values, series, points, or matrix data'));
      if(hasValues&&Array.isArray(chart.labels)&&chart.labels.length!==chart.values.length)errors.push(problem(`$.charts[${index}]`,'labels and values must have equal length'));
      if(hasSeries&&Array.isArray(chart.labels)&&chart.series.some(series=>series.values.length!==chart.labels.length))errors.push(problem(`$.charts[${index}].series`,'every series must match labels length'));
    }
  }
  for(const[index,image]of(request.images||request.content?.images||[]).entries())if(!image?.src&&!image?.path)errors.push(problem(`$.images[${index}]`,'requires src or path'));
  for(const[index,ref]of(request.references||request.content?.references||[]).entries())if(!ref?.url&&!ref?.source)errors.push(problem(`$.references[${index}]`,'requires url or source'));
  if(request.opening!==undefined&&(!request.opening||typeof request.opening!=='object'||Array.isArray(request.opening)))errors.push(problem('$.opening','must be an object'));
  if(request.closing!==undefined&&(!request.closing||typeof request.closing!=='object'||Array.isArray(request.closing)))errors.push(problem('$.closing','must be an object'));
  if(request.assetPolicy!==undefined){
    if(!request.assetPolicy||typeof request.assetPolicy!=='object'||Array.isArray(request.assetPolicy))errors.push(problem('$.assetPolicy','must be an object'));
    else{
      for(const key of Object.keys(request.assetPolicy))if(!['remote','offlineRequired','embedLocal'].includes(key))errors.push(problem(`$.assetPolicy.${key}`,'unknown asset policy option'));
      if(request.assetPolicy.remote&&!['allow','warn','deny'].includes(request.assetPolicy.remote))errors.push(problem('$.assetPolicy.remote','must be allow, warn, or deny'));
      for(const key of ['offlineRequired','embedLocal'])if(request.assetPolicy[key]!==undefined&&typeof request.assetPolicy[key]!=='boolean')errors.push(problem(`$.assetPolicy.${key}`,'must be boolean'));
    }
  }
  if(request.uiLibraries!==undefined){if(!request.uiLibraries||typeof request.uiLibraries!=='object'||Array.isArray(request.uiLibraries))errors.push(problem('$.uiLibraries','must be an object'));else{for(const key of Object.keys(request.uiLibraries))if(!['mode','allow','deny','needs','maxLibraries','preferVendor','network','portable'].includes(key))errors.push(problem(`$.uiLibraries.${key}`,'unknown UI library option'));if(request.uiLibraries.mode&&!['auto','native','recipe','vendor'].includes(request.uiLibraries.mode))errors.push(problem('$.uiLibraries.mode','must be auto, native, recipe, or vendor'));for(const key of ['allow','deny','needs'])if(request.uiLibraries[key]!==undefined&&!Array.isArray(request.uiLibraries[key]))errors.push(problem(`$.uiLibraries.${key}`,'must be an array'));if(request.uiLibraries.maxLibraries!==undefined&&(!Number.isInteger(request.uiLibraries.maxLibraries)||request.uiLibraries.maxLibraries<1||request.uiLibraries.maxLibraries>6))errors.push(problem('$.uiLibraries.maxLibraries','must be an integer from 1 to 6'))}}
  if(request.generation!==undefined){
    if(!request.generation||typeof request.generation!=='object'||Array.isArray(request.generation))errors.push(problem('$.generation','must be an object'));
    else{for(const key of Object.keys(request.generation))if(!['contentPolicy','allowQualityWarnings','renderQA','repairPasses','requireIntake'].includes(key))errors.push(problem(`$.generation.${key}`,'unknown generation option'));if(request.generation.renderQA!==undefined&&typeof request.generation.renderQA!=='boolean')errors.push(problem('$.generation.renderQA','must be boolean'));if(request.generation.contentPolicy&&!['adjust','strict'].includes(request.generation.contentPolicy))errors.push(problem('$.generation.contentPolicy','must be adjust or strict'));if(request.generation.requireIntake!==undefined&&typeof request.generation.requireIntake!=='boolean')errors.push(problem('$.generation.requireIntake','must be boolean'))}
  }
  if(request.intake!==undefined){if(!request.intake||typeof request.intake!=='object'||Array.isArray(request.intake))errors.push(problem('$.intake','must be an object'));else{if(!['pending','complete','bypassed'].includes(request.intake.status))errors.push(problem('$.intake.status','must be pending, complete, or bypassed'));if(request.intake.answers!==undefined&&(!request.intake.answers||typeof request.intake.answers!=='object'||Array.isArray(request.intake.answers)))errors.push(problem('$.intake.answers','must be an object'))}}
  return{valid:errors.length===0,errors};
}

export function assertValidGenerationRequest(request){const result=validateGenerationRequest(request);if(!result.valid)throw new Error(`Generation request validation failed:\n${result.errors.map(error=>`  - ${error}`).join('\n')}`);return request}
