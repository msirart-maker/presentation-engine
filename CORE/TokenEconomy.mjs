const bytes=value=>Buffer.byteLength(typeof value==='string'?value:JSON.stringify(value));
const tokens=value=>Math.ceil(bytes(value)/4);

export function tokenEconomy({request,schema,htmlBytes,embeddedAssetBytes=0}){
  const requestBytes=bytes(request),schemaBytes=bytes(schema),generatedHtmlBytes=Number(htmlBytes||0);
  const requestTokens=tokens(request),schemaTokens=tokens(schema),htmlTokens=Math.ceil(Math.max(0,generatedHtmlBytes-embeddedAssetBytes)/4);
  const avoidance=htmlTokens?Math.max(0,1-requestTokens/htmlTokens):0;
  return {
    version:'13.5.0',requestBytes,schemaBytes,htmlBytes:generatedHtmlBytes,embeddedAssetBytes,codeBytesExcludingEmbeddedAssets:Math.max(0,generatedHtmlBytes-embeddedAssetBytes),
    estimatedRequestTokens:requestTokens,estimatedExpandedSchemaTokens:schemaTokens,estimatedGeneratedCodeTokens:htmlTokens,estimateMethod:'UTF-8 bytes / 4; directional only, not provider token accounting',
    generatedToAuthoredRatio:requestBytes?Math.round(generatedHtmlBytes/requestBytes*10)/10:0,
    generatedCodeAvoidanceEstimatePercent:Math.round(avoidance*1000)/10,
    measuredEndToEndTokenSavingPercent:null,
    claimStatus:'unmeasured',
    note:'The avoidance estimate compares authored request bytes with generated HTML bytes excluding recognized embedded base64 asset URLs. It is an expansion/avoided-output indicator, not a measured end-to-end token saving. A measured value requires an identical direct-coding baseline.'
  };
}
