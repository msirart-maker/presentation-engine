const count=component=>{const data=component?.data||{};return(data.cards||data.images||data.items||data.charts||data.columns||data.references||data.rows||[]).length};

export class ResponsiveLayoutResolver {
  apply(schema={}){
    const clone=structuredClone(schema),plans=[];
    for(const slide of clone.slides||[]){const units=(slide.components||[]).reduce((sum,item)=>sum+Math.max(1,count(item)),0),typeRisk=slide.__typography?.overflowRisk||'low',overflowRisk=typeRisk==='high'||units>9?'high':typeRisk==='medium'||units>6?'medium':'low',mobile=overflowRisk==='high'?'scroll':'stack',tablet=(slide.components||[]).length>1?'split':'fit',maxColumns=overflowRisk==='high'?2:3,repairs=[];
      slide.className=[slide.className,`responsive-${mobile}`,`tablet-${tablet}`,`layout-risk-${overflowRisk}`].filter(Boolean).join(' ');
      if(overflowRisk==='high'&&(!slide.density||slide.density==='auto')){slide.density='compact';repairs.push('compact-density')}
      for(const component of slide.components||[]){if(component.type==='GlassCard'&&count(component)>4){const previous=component.data.columns||3;component.data.columns=Math.min(maxColumns,previous);if(component.data.columns!==previous)repairs.push(`columns:${previous}->${component.data.columns}`)}if(component.type==='UIRecipe'&&count(component)>6){component.data.columns=Math.min(maxColumns,component.data.columns||3);repairs.push('ui-recipe-columns')}if(component.type==='Charts'&&count(component)>1)component.className=[component.className,'charts-adaptive'].filter(Boolean).join(' ')}
      const plan={slideId:slide.id,units,overflowRisk,mobile,tablet,maxColumns,repairs};slide.__responsive=plan;plans.push(plan)}
    clone.__responsive={version:'13.5.0',breakpoints:{compact:680,tablet:1024,wide:1440},strategy:'component-aware-fit-plan',slides:plans,summary:{highRisk:plans.filter(plan=>plan.overflowRisk==='high').length,repairs:plans.reduce((sum,plan)=>sum+plan.repairs.length,0)}};return clone;
  }
}
