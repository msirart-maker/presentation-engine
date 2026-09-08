export function qualityReceipt({inventory,sufficiency,allocation,composition,semantic,duplication,tokenEconomy,render,production}={}){
  const contentChecked=typeof production?.contentReview?.valid==='boolean';
  const assetsChecked=production?.assetReview!==undefined;
  const structuralPass=semantic?.passed===true&&duplication?.passed===true&&contentChecked&&production.contentReview.valid&&assetsChecked&&!(production.assetReview.errors||[]).length;
  const scores=[semantic?.score,duplication?.score,production?.contentReview?.score].filter(Number.isFinite);
  const structuralScore=scores.length?Math.round(scores.reduce((sum,value)=>sum+value,0)/scores.length):null;
  const browser=render||{status:'not-run',passed:null,score:null};
  return {
    version:'13.5.0',status:!structuralPass?'review':browser.passed===true?'browser-verified':browser.passed===false&&browser.status!=='blocked'?'review':'structurally-validated',
    qualityScore:structuralScore,scoreMeaning:'Structural/content-rule score only; not a measure of aesthetics, factual accuracy, or device certification.',
    verification:{structural:{status:structuralPass?'pass':'review',score:structuralScore},browser:{status:browser.status,passed:browser.passed},factualAccuracy:{status:'not-verified',responsibility:'AI/source review'},visualDesign:{status:'not-reviewed',responsibility:'Rendered visual inspection'},physicalDevices:{status:'not-tested'}},
    content:{units:inventory?.summary?.units||0,blocks:inventory?.summary?.blocks||0,coverage:allocation?.coverage?.ratio??0,unusedUnits:allocation?.coverage?.unusedUnits||[],sufficiency},
    narrative:{semanticScore:semantic?.score??0,duplicationScore:duplication?.score??0,semanticFindings:semantic?.findings||[],duplicationFindings:duplication?.findings||[]},
    composition:composition?.metrics||{},production:production||{contentReview:{status:'not-run'},assetReview:{status:'not-run'}},render:browser,efficiency:tokenEconomy
  };
}
