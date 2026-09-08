const ALTERNATES={GlassCard:'ComparisonGrid',ComparisonGrid:'GlassCard',HeroScene:'GlassCard'};
const TONES=['ember','blue','gold','teal'];

function phaseAt(index,total,kind){
  if(kind==='closing'||index>=Math.ceil(total*.78))return'calm';
  if(kind==='opening'||index<Math.max(1,Math.floor(total*.25)))return'storm';
  return'neutral';
}

function accentFor(block,phase,index,previous){
  const source=`${block.title||''} ${block.summary||''}`.toLowerCase();
  let tone=/recover|calm|improv|success|stable|resolve|future/.test(source)?'teal':/risk|fail|critical|problem|storm|danger/.test(source)?'ember':/key|priority|peak|opportun/.test(source)?'gold':phase==='storm'?'ember':phase==='calm'?'teal':TONES[index%TONES.length];
  if(tone===previous&&index%2)tone=TONES[(TONES.indexOf(tone)+1)%TONES.length];
  return tone;
}

export class VisualRhythmPlanner{
  apply(plan,allocationResult,compositionResult){
    let run=0,last='',lastAccent='';
    const compositions=compositionResult.compositions.map((composition,index)=>{
      const block=allocationResult.allocations[index].block;
      run=composition.signature===last?run+1:1;
      if(run>=3&&ALTERNATES[composition.primary]&&block.kind!=='opening'){
        composition={...composition,primary:ALTERNATES[composition.primary],secondary:null,layout:'single'};
        composition.signature=composition.primary;composition.reason+='; varied to prevent a three-slide repetition';run=1;
      }
      last=composition.signature;
      const phase=plan.request?.narrativeArc==='storm-to-calm'?phaseAt(index,compositionResult.compositions.length,block.kind):'neutral',accent=accentFor(block,phase,index,lastAccent);lastAccent=accent;
      const weight=(block.items?.length||block.images?.length||block.references?.length||0)+(block.chart?3:0)+(block.comparison?3:0);
      return {...composition,design:{phase,accent,density:weight>=6?'compact':weight<=1?'airy':'balanced',surface:plan.request?.narrativeArc==='storm-to-calm'?(phase==='storm'?(index%2?'dark':'deep'):phase==='calm'?'calm':(index%2?'card':'light')):undefined}};
    });
    let maximumConsecutive=0,current=0,previous='';
    for(const item of compositions){current=item.signature===previous?current+1:1;maximumConsecutive=Math.max(maximumConsecutive,current);previous=item.signature}
    return {version:'13.5.0',domain:compositionResult.domain,grammar:compositionResult.grammar,compositions,metrics:{distinctCompositions:new Set(compositions.map(item=>item.signature)).size,maximumConsecutive,visualSlides:compositions.filter(item=>!['GlassCard','ClosingScene','ReferencePanel'].includes(item.primary)).length,denseSlides:compositions.filter(item=>item.design.density==='compact').length}};
  }
}
