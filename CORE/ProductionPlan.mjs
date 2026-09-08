const SUPPORTED=new Set(['HeroScene','GlassCard','ImageStoryCard','Timeline','Charts','ComparisonGrid','ReferencePanel','ClosingScene','UIRecipe']);

export class ProductionPlan {
  constructor(data={}){
    Object.assign(this,data);
    this.version='13.5.0';
    this.stages=(data.stages||[]).map((stage,index)=>({index,...stage}));
    this.validate();
  }
  validate(){
    if(!this.domain) throw new Error('ProductionPlan requires domain');
    if(!this.blueprint?.id) throw new Error('ProductionPlan requires blueprint');
    for(const stage of this.stages){
      for(const component of stage.components?.recommended||[]){
        if(!SUPPORTED.has(component)) throw new Error(`Unsupported render component in production plan: ${component}`);
      }
    }
    return this;
  }
  toJSON(){
    return {
      version:this.version,request:this.request,domain:this.domain,domainConfidence:this.domainConfidence,
      blueprint:this.blueprint,knowledge:this.knowledge,stages:this.stages,warnings:this.warnings||[],
      improvementGuidance:this.improvementGuidance||[],content:this.content||null,sufficiency:this.sufficiency||null,allocations:this.allocations||[],compositions:this.compositions||[],quality:this.quality||null
    };
  }
  summary(){
    return `${this.domain} / ${this.blueprint.id} / ${this.stages.length} planned slides`;
  }
}

export const RENDER_COMPONENTS=Object.freeze([...SUPPORTED]);
