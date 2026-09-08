const BASE={duration:850,delay:80,trigger:'slideEnter',reset:'slideExit'};
export class AnimationAdvisor {
  forComponent(type,{closing=false}={}){
    if(type==='HeroScene') return [
      {type:'heroSequence',target:'@title',duration:1100,delay:80,trigger:'slideEnter',reset:'slideExit'},
      {type:'fadeUp',target:'@subtitle',...BASE,delay:280},
      {type:'scale',target:'@heroVisual',duration:1300,delay:180,trigger:'slideEnter',reset:'slideExit'},
      {type:'particles',target:'@heroVisual',duration:0,delay:300,trigger:'slideEnter',reset:'slideExit'},
      {type:'countUp',target:'[data-v10-count]',duration:1300,delay:480,trigger:'slideEnter',reset:'slideExit'}
    ];
    if(type==='Charts') return [{type:'fadeUp',target:'@title',...BASE},{type:'chartDraw',target:'[data-v10-chart]',duration:1450,delay:280,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='Timeline') return [{type:'fadeUp',target:'@title',...BASE},{type:'stagger',target:'@timelineItem',duration:720,delay:230,stagger:95,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='ComparisonGrid') return [{type:'fadeUp',target:'@title',...BASE},{type:'stagger',target:'@comparisonColumn',duration:740,delay:240,stagger:120,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='GlassCard') return [{type:'fadeUp',target:'@title',...BASE},{type:'stagger',target:'@card',duration:700,delay:220,stagger:90,effect:'fadeUp',trigger:'slideEnter',reset:'slideExit'},{type:'countUp',target:'[data-v10-count]',duration:1250,delay:420,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='ImageStoryCard') return [{type:'fadeUp',target:'@title',...BASE},{type:'stagger',target:'@imageCard',duration:760,delay:220,stagger:100,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='ReferencePanel') return [{type:'fadeUp',target:'@title',...BASE},{type:'stagger',target:'@reference',duration:680,delay:220,stagger:75,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='UIRecipe') return [{type:'fadeUp',target:'@title',...BASE},{type:'stagger',target:'@uiItem',duration:680,delay:180,stagger:80,effect:'fadeUp',trigger:'slideEnter',reset:'slideExit'},{type:'countUp',target:'[data-v10-count]',duration:1100,delay:350,trigger:'slideEnter',reset:'slideExit'}];
    if(type==='ClosingScene'||closing) return [{type:'chapterTransition',target:'@title',duration:1150,delay:100,trigger:'slideEnter',reset:'slideExit'},{type:'fadeUp',target:'@quote',duration:900,delay:340,trigger:'slideEnter',reset:'slideExit'},{type:'scale',target:'@heroVisual',duration:1400,delay:240,trigger:'slideEnter',reset:'slideExit'},{type:'particles',target:'@heroVisual',duration:0,delay:340,trigger:'slideEnter',reset:'slideExit'}];
    return [{type:'fadeUp',target:'@title',...BASE}];
  }
}
