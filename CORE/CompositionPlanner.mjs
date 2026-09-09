import {selectComposition} from '../COMPOSITIONS/registry.mjs';
const DOMAIN_GRAMMARS=Object.freeze({
  architecture:{id:'spatial-portfolio',section:['HeroScene','ComparisonGrid','GlassCard'],detail:['ComparisonGrid','GlassCard'],facts:['ComparisonGrid','GlassCard']},
  business:{id:'decision-brief',section:['GlassCard','ComparisonGrid'],detail:['ComparisonGrid','GlassCard'],facts:['GlassCard','ComparisonGrid']},
  medical:{id:'clinical-reasoning',section:['GlassCard','ComparisonGrid'],detail:['GlassCard','ComparisonGrid'],facts:['ComparisonGrid','GlassCard']},
  science:{id:'evidence-story',section:['HeroScene','GlassCard'],detail:['GlassCard','ComparisonGrid'],facts:['GlassCard','ComparisonGrid']},
  general:{id:'editorial-story',section:['HeroScene','GlassCard'],detail:['ComparisonGrid','GlassCard'],facts:['GlassCard','ComparisonGrid']}
});

function grammarFor(domain='general'){
  const key=String(domain).toLowerCase();
  return DOMAIN_GRAMMARS[key]||DOMAIN_GRAMMARS.general;
}

function genericPrimary(block,index,grammar){
  if(block.kind==='opening')return'HeroScene';
  if(block.kind==='closing')return'ClosingScene';
  if(block.kind==='references')return'ReferencePanel';
  if(block.kind==='timeline')return'Timeline';
  if(block.kind==='chart')return'Charts';
  if(block.kind==='comparison')return'ComparisonGrid';
  if(block.kind==='images'||block.image)return'ImageStoryCard';
  if(block.kind==='ui-recipe'||block.uiRecipe)return'UIRecipe';
  const key=block.kind==='section-detail'?'detail':block.kind==='facts'?'facts':'section';
  const candidates=grammar[key]||grammar.section;
  if(!block.items?.length&&block.summary&&candidates.includes('HeroScene'))return'HeroScene';
  return candidates[index%candidates.length]||'GlassCard';
}

function secondaryFor(block,primary,grammar,index){
  if(primary==='ImageStoryCard'&&block.items?.length)return'GlassCard';
  if(primary==='Charts'&&block.summary)return'GlassCard';
  if(primary==='HeroScene'&&block.items?.length&&grammar.id==='spatial-portfolio')return'GlassCard';
  if(primary==='GlassCard'&&block.summary&&block.items?.length>=3&&index%2)return'ComparisonGrid';
  return null;
}

function layoutFor(primary,secondary,grammar,index){
  if(!secondary)return'single';
  if(grammar.id==='spatial-portfolio'&&primary==='ImageStoryCard')return index%2?'split':'stack';
  return'split';
}

export class CompositionPlanner{
  plan(plan,allocationResult){
    const grammar=grammarFor(plan.domain);
    let previousPattern=null;
    const compositions=allocationResult.allocations.map((allocation,index)=>{
      const block=allocation.block,pattern=selectComposition(block,{previousPattern});previousPattern=pattern;if(pattern)block.uiRecipe={...(block.uiRecipe||{}),pattern,items:block.items};const primary=pattern?'UIRecipe':genericPrimary(block,index,grammar),secondary=pattern?null:secondaryFor(block,primary,grammar,index),layout=layoutFor(primary,secondary,grammar,index);
      return {index,blockId:block.id,grammar:grammar.id,layout,primary,secondary,pattern,signature:pattern?`UIRecipe:${pattern}`:secondary?`${primary}+${secondary}`:primary,reason:`${grammar.id}: ${block.kind} content mapped to ${primary}${secondary?` with ${secondary} support`:''}`};
    });
    return {version:'13.5.0',domain:plan.domain,grammar:grammar.id,compositions};
  }
}

export const COMPOSITION_GRAMMARS=DOMAIN_GRAMMARS;
