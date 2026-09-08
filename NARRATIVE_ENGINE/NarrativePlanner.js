/**
 * V10.4 Narrative Engine
 * Converts a topic brief into a cinematic story architecture.
 * AI-agnostic: can be driven by any planner model.
 */
export class NarrativePlanner {
  constructor(options={}) { this.options=options; }

  analyze(input={}) {
    const text = `${input.title||''} ${input.topic||''} ${input.audience||''}`.toLowerCase();
    const scientific = /(medical|science|disease|clinical|biology|research|diagnosis)/.test(text);
    const business = /(market|company|strategy|business|product)/.test(text);
    const architecture = /(building|tower|architecture|city|design)/.test(text);
    return {scientific,business,architecture, emotionalTone:this.resolveTone(text)};
  }

  createArc(input={}) {
    const profile=this.analyze(input);
    if(profile.scientific) return ['The Question','The Hidden Mechanism','The Evidence','The Turning Point','The Solution','The Lessons'];
    if(profile.business) return ['The Challenge','The Landscape','The Insight','The Strategy','The Execution','The Future'];
    if(profile.architecture) return ['The Vision','The Rise','The Engineering','The Human Impact','The Legacy'];
    return ['Opening','Discovery','Exploration','Revelation','Closing'];
  }

  resolveTone(text){
    if(/crisis|storm|failure|risk|danger/.test(text)) return 'tension-to-resolution';
    if(/future|innovation|space|technology/.test(text)) return 'wonder';
    return 'curiosity';
  }
}
