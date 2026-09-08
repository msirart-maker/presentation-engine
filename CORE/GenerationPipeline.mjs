import {guidanceFor} from './ImprovementStore.mjs';
import {assertResolvedIntake} from './IntakeResolver.mjs';
import {GenerationOrchestrator} from './GenerationOrchestrator.mjs';
import {SchemaMaterializer} from './SchemaMaterializer.mjs';
import {ContentInventory} from './ContentInventory.mjs';
import {ContentSufficiency} from './ContentSufficiency.mjs';
import {NarrativeAllocator} from './NarrativeAllocator.mjs';
import {CompositionPlanner} from './CompositionPlanner.mjs';
import {VisualRhythmPlanner} from './VisualRhythmPlanner.mjs';
import {SemanticCritic} from './SemanticCritic.mjs';
import {DuplicationGuard} from './DuplicationGuard.mjs';

export class GenerationQualityError extends Error{
  constructor(message,review){super(message);this.name='GenerationQualityError';this.review=review}
}

export class GenerationPipeline{
  constructor(options={}){
    this.inventory=options.inventory||new ContentInventory();this.sufficiency=options.sufficiency||new ContentSufficiency();
    this.orchestrator=options.orchestrator||new GenerationOrchestrator(options);this.allocator=options.allocator||new NarrativeAllocator();
    this.compositions=options.compositions||new CompositionPlanner();this.rhythm=options.rhythm||new VisualRhythmPlanner();
    this.materializer=options.materializer||new SchemaMaterializer(options);this.semantic=options.semantic||new SemanticCritic();this.duplication=options.duplication||new DuplicationGuard();
  }
  compile(request={}){
    request=assertResolvedIntake(request).request;
    const inventory=this.inventory.build(request),policy=request.generation?.contentPolicy||request.contentPolicy||'adjust';
    const sufficiency=this.sufficiency.assess(inventory,request.slideCount||12,{policy});
    const effectiveRequest={...request,slideCount:sufficiency.selectedSlideCount};
    const plan=this.orchestrator.createPlan(effectiveRequest);
    plan.improvementGuidance=guidanceFor(effectiveRequest);
    const allocation=this.allocator.allocate(plan,inventory,{slideCount:sufficiency.selectedSlideCount});
    const initialComposition=this.compositions.plan(plan,allocation),composition=this.rhythm.apply(plan,allocation,initialComposition);
    const semantic=this.semantic.review({request,plan,inventory,allocation,composition,sufficiency});
    if(!semantic.passed&&!request.generation?.allowQualityWarnings)throw new GenerationQualityError('Semantic quality gate rejected the generation request.',semantic);
    const schema=this.materializer.materialize(request,plan,{inventory,allocation,composition});
    const duplication=this.duplication.inspect({schema,allocations:allocation.allocations});
    if(!duplication.passed&&!request.generation?.allowQualityWarnings)throw new GenerationQualityError('Duplication quality gate rejected the generated schema.',duplication);
    plan.content=inventory.summary;plan.sufficiency=sufficiency;
    plan.allocations=allocation.allocations.map(({block,...item})=>item);plan.compositions=composition.compositions;
    plan.quality={semantic,duplication,coverage:allocation.coverage,composition:composition.metrics};
    plan.warnings=[...(plan.warnings||[]),...sufficiency.warnings,...semantic.findings.filter(finding=>finding.severity!=='high').map(finding=>finding.message)];
    return {request:effectiveRequest,inventory,sufficiency,plan,allocation,composition,semantic,duplication,schema};
  }
}

