/**
 * V10.4 Visual Director
 * Provides semantic visual decisions instead of random styling.
 */
export class VisualDirector {
  selectVisualLanguage(topic='') {
    const t=topic.toLowerCase();
    if(/medical|clinical|disease|immune|patient/.test(t)) return {
      palette:'clinical-cinematic', metaphors:['storm','microscope','pathway','recovery'],
      imagery:'documentary-scientific'
    };
    if(/architecture|building|tower/.test(t)) return {
      palette:'architectural-night', metaphors:['rise','scale','structure'], imagery:'cinematic-city'
    };
    return {palette:'adaptive', metaphors:['journey','contrast','reveal'], imagery:'editorial-cinematic'};
  }

  compose(slide={}) {
    return {focalPoint:slide.importance==='high'?'center':'rule-of-thirds',
      textDensity:slide.density||'balanced',
      imageRole:slide.imageRole||'supporting'};
  }
}
