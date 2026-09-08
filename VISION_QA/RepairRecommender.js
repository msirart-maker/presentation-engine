/**
 * Converts visual findings into engine repair intents.
 */
export class RepairRecommender {
  recommend(findings=[]){
    return findings.map(item=>{
      switch(item.issue){
        case 'overflow':
          return {slide:item.slide, action:'reflow', target:'layout'};
        case 'low_contrast':
          return {slide:item.slide, action:'increase_contrast', target:'theme'};
        case 'weak_hierarchy':
          return {slide:item.slide, action:'strengthen_visual_order', target:'composition'};
        case 'empty_composition':
          return {slide:item.slide, action:'add_visual_anchor', target:'visual'};
        default:
          return {slide:item.slide, action:'review', target:'manual'};
      }
    });
  }
}
