/** V13 Presentation Director — executable bridge between knowledge orchestration and rendering. */
import {NarrativePlanner} from '../NARRATIVE_ENGINE/NarrativePlanner.js';
import {VisualDirector} from '../VISUAL_ENGINE/VisualDirector.js';
import {PresentationCritic} from '../CRITIC_ENGINE/PresentationCritic.js';
import {ClosedLoopDesigner} from '../ADAPTIVE_ENGINE/ClosedLoopDesigner.js';
import {RepairRecommender} from '../VISION_QA/RepairRecommender.js';
import {GenerationOrchestrator} from './GenerationOrchestrator.mjs';

export class PresentationDirector {
  constructor(options={}){
    this.narrative=new NarrativePlanner(options);
    this.visual=new VisualDirector(options);
    this.critic=new PresentationCritic(options);
    this.closedLoop=new ClosedLoopDesigner(options);
    this.repairRecommender=new RepairRecommender();
    this.orchestrator=new GenerationOrchestrator(options);
    this.lastPlan=null;this.lastReview=null;this.lastIntelligence=null;this.lastDeferred=[];
  }
  plan(schema={},options={}){
    const plan=options.plan||this.orchestrator.createPlan({...schema,slideCount:schema.slides?.length||12});
    const planned=this.orchestrator.applyPlanToSchema(schema,plan);
    this.lastPlan=plan;
    this.lastIntelligence={
      narrativeArc:this.narrative.createArc({...schema,domain:plan.domain}),
      visualLanguage:this.visual.selectVisualLanguage(`${schema.title||''} ${schema.description||''} ${plan.domain}`),
      generatedBy:'V13 Quality-Gated Generation Pipeline'
    };
    return planned;
  }
  critique(schema={}){this.lastReview=this.critic.review(schema);return this.lastReview}
  adaptiveImprove(schema={}){
    const review=this.critique(schema);
    const result=this.closedLoop.improve(schema,review);
    this.lastDeferred=result.deferred||[];
    return result.schema;
  }
  repairPlan(){
    const automated=this.repairRecommender.recommend(this.lastReview?.findings||[]);
    return {automated,deferred:this.lastDeferred};
  }
  getLastPlan(){return this.lastPlan?.toJSON?.()||this.lastPlan}
}
