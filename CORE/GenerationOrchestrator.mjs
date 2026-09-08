import {RequestNormalizer} from './RequestNormalizer.mjs';
import {DomainDetector} from './DomainDetector.mjs';
import {KnowledgeRepository} from './KnowledgeRepository.mjs';
import {ProductionPlan,RENDER_COMPONENTS} from './ProductionPlan.mjs';
import {AnimationAdvisor} from './AnimationAdvisor.mjs';

const COMPONENT_RULES=[
  [/closing|lesson|take_home|legacy|implication|future|calm_after/,['ClosingScene','GlassCard']],
  [/reference|source|bibliograph/,['ReferencePanel','GlassCard']],
  [/timeline|history|origin|journey|sequence|management_pathway/,['Timeline','GlassCard']],
  [/result|evidence|traction|impact|response|trend|metric|data/,['Charts','GlassCard']],
  [/compare|versus|differential|controversy|turning_point|strategy/,['ComparisonGrid','GlassCard']],
  [/mechanism|pathway|method|structural|process/,['ComparisonGrid','Timeline','GlassCard']],
  [/opening|question|context|vision|problem|clinical_mystery|market_problem/,['HeroScene','ImageStoryCard']],
  [/experience|portfolio|visual|image/,['ImageStoryCard','HeroScene']],
];
const ACCENT={storm:'ember',neutral:'blue',calm:'teal'};
const STAGE_BEATS={
  opening:['hook','premise','stakes'],context:['overview','scale','significance'],origin:['foundation','evolution','inflection'],
  background:['foundation','prior knowledge','unresolved gap'],question:['central question','why it matters','working hypothesis'],
  evidence:['signal','pattern','meaning'],evidence_wall:['signal','relationship','synthesis'],results:['headline result','supporting evidence','interpretation'],
  method:['approach','execution','quality controls'],design_philosophy:['principle','expression','trade-off'],structural_reveal:['system','load path','innovation'],
  experience:['human scale','spatial sequence','lasting impression'],turning_point:['old frame','decisive clue','new frame'],diagnostic_turning_point:['old frame','decisive clue','new diagnosis'],
  mechanism_reveal:['trigger','cascade','effect'],management_pathway:['priority','intervention','monitoring'],treatment_response:['baseline','response','outcome'],
  interpretation:['meaning','limits','connection'],resolution:['answer','impact','new equilibrium'],implication:['consequence','application','future'],
  strategy:['choice','execution','advantage'],impact:['result','meaning','next horizon'],legacy:['meaning','influence','future'],closing:['reflection','lesson','final image'],lessons_learned:['lesson','application','final thought']
};
const safeClone=v=>typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));
const unique=values=>[...new Set(values)];

function phaseFor(stage,index,total){
  const id=stage.toLowerCase();
  if(/closing|lesson|take_home|legacy|implication|future|calm|response|impact/.test(id)||index>=Math.ceil(total*.78))return'calm';
  if(/mystery|problem|challenge|risk|storm|question|context/.test(id)||index<Math.max(1,Math.floor(total*.28)))return'storm';
  return'neutral';
}
function defaultComponents(stage){
  for(const[pattern,types]of COMPONENT_RULES)if(pattern.test(stage))return types;
  return['GlassCard'];
}
function variationFor(type,stage){
  if(type==='HeroScene')return /opening|mystery|vision/.test(stage)?'minimal':'split';
  if(type==='GlassCard')return /evidence|result|lesson/.test(stage)?'feature':'grid';
  if(type==='Timeline')return'rail';
  if(type==='Charts')return'focus';
  if(type==='ComparisonGrid')return'versus';
  if(type==='ImageStoryCard')return'cinema';
  if(type==='ClosingScene')return'minimal';
  return'standard';
}

export class GenerationOrchestrator {
  constructor(options={}){
    this.normalizer=options.normalizer||new RequestNormalizer();
    this.detector=options.detector||new DomainDetector();
    this.repository=options.repository||new KnowledgeRepository(options);
    this.animations=options.animations||new AnimationAdvisor();
  }

  createPlan(request={}){
    const normalized=this.normalizer.normalize(request);
    const detected=this.detector.detect(normalized);
    const domain=detected.domain;
    const blueprint=this.repository.selectBlueprint(domain,normalized.intent);
    const stages=this.expandStages(blueprint.slides||[],normalized.slideCount).map((stageSpec,index,all)=>{
      const {stageId,instanceId,segmentIndex,segmentCount,beat}=stageSpec;
      const scene=this.repository.findScene(stageId,domain);
      const recipe=this.repository.selectRecipe(stageId,domain);
      const recipeComponents=(recipe?.supportedComponents||recipe?.components||[]).filter(type=>RENDER_COMPONENTS.includes(type));
      let recommended=unique([...recipeComponents,...defaultComponents(stageId)]).filter(type=>RENDER_COMPONENTS.includes(type));
      const phase=phaseFor(stageId,index,all.length);
      if(index===all.length-1)recommended=unique(['ClosingScene',...recommended]);
      const primary=index===all.length-1?'ClosingScene':recommended[segmentIndex%recommended.length]||'GlassCard';
      return {
        stageId,instanceId,segmentIndex,segmentCount,beat,scene:{id:scene.id,purpose:scene.purpose||scene.use||'',beats:scene.beats||[]},
        recipe:recipe?{id:recipe.id,use:recipe.use||'',abstractComponents:recipe.abstractComponents||[]}:null,
        components:{recommended,primary},
        design:{phase,accent:ACCENT[phase],density:'balanced',variation:variationFor(primary,stageId)},
        animations:this.animations.forComponent(primary,{closing:index===all.length-1})
      };
    });
    const knowledge=this.retrieveKnowledge(domain,normalized);
    return new ProductionPlan({
      request:{narrativeArc:normalized.source.design?.narrativeArc||'neutral',title:normalized.title,description:normalized.description,audience:normalized.audience,intent:normalized.intent,slideCount:normalized.slideCount},
      domain,domainConfidence:detected.confidence,blueprint:{id:blueprint.id,domain:blueprint.domain,sourceSlides:blueprint.slides||[]},knowledge,stages,
      warnings:detected.confidence<.5?['Low domain confidence; general fallbacks may be used.']:[]
    });
  }

  expandStages(source,count){
    const stages=source?.length?source:['opening','context','evidence','turning_point','resolution','closing'];
    const selected=count<stages.length
      ?Array.from({length:count},(_,i)=>stages[Math.round(i*(stages.length-1)/Math.max(1,count-1))])
      :Array.from({length:count},(_,i)=>stages[Math.min(stages.length-1,Math.floor(i*stages.length/count))]);
    const totals=new Map();for(const stageId of selected)totals.set(stageId,(totals.get(stageId)||0)+1);
    const seen=new Map();return selected.map(stageId=>{const segmentIndex=seen.get(stageId)||0;seen.set(stageId,segmentIndex+1);const segmentCount=totals.get(stageId)||1,beats=STAGE_BEATS[stageId]||['overview','development','meaning','application'];return{stageId,instanceId:`${stageId}_${segmentIndex+1}`,segmentIndex,segmentCount,beat:beats[segmentIndex%beats.length]}});
  }

  retrieveKnowledge(domain,normalized){
    const memories=this.repository.memories(domain).slice(0,3).map(item=>item.id);
    const failures=this.repository.failures().slice(0,5).map(item=>item.pattern||item.id).filter(Boolean);
    const browserLessons=this.repository.bugs().slice(0,5).map(item=>item.problem||item.id).filter(Boolean);
    const pack=this.repository.domainPack(domain);
    return {
      domainPack:pack.id||pack.domain||domain,
      patternRefs:Object.keys(pack.presentation_types||{}),
      memoryRefs:memories,
      failureRefs:failures,
      browserPolicyRefs:browserLessons,
      strategy:'compact references; full knowledge remains in KNOWLEDGE_INDEX/v13-runtime-index.json'
    };
  }

  applyToSchema(schema={}){
    const plan=this.createPlan({...schema,slideCount:schema.slides?.length||12});
    return {schema:this.applyPlanToSchema(schema,plan),plan};
  }

  applyPlanToSchema(schema={},plan){
    const next=safeClone(schema);
    next.design={mode:'auto',mood:this.moodFor(plan.domain),accentStrategy:'semantic',density:'auto',...(next.design||{})};
    next.slides=(next.slides||[]).map((slide,index)=>{
      const stage=plan.stages[index]||plan.stages.at(-1);
      const components=(slide.components||[]).map(component=>({...component,variation:component.variation||variationFor(component.type,stage.stageId)}));
      return {
        ...slide,
        phase:slide.phase||stage.design.phase,
        accent:slide.accent||stage.design.accent,
        components,
        animations:(slide.animations&&slide.animations.length)?slide.animations:this.animations.forComponent(components[0]?.type||stage.components.primary,{closing:index===next.slides.length-1})
      };
    });
    return next;
  }

  moodFor(domain){return ({medical:'clinical',science:'futuristic',business:'cinematic',architecture:'architectural'}[domain]||'cinematic')}
}
