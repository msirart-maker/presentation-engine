const WORD=/[a-z0-9][a-z0-9+/#.-]*/gi;
const UNIQUE=values=>[...new Set(values.filter(Boolean))];

export function tokenize(value=''){
  return UNIQUE(String(value).toLowerCase().match(WORD)||[]);
}

export function normalizeIntent(value=''){
  const text=String(value||'').toLowerCase().replace(/[\s-]+/g,'_');
  if(/case|grand_round|clinical/.test(text)) return text.includes('grand')?'grand_rounds':'case_report';
  if(/research|paper|study|scientific/.test(text)) return 'research_story';
  if(/invest|pitch|fund|startup/.test(text)) return 'investor_pitch';
  if(/architect|portfolio|building/.test(text)) return 'architecture_portfolio';
  if(/teach|lecture|education/.test(text)) return 'teaching';
  return text||'auto';
}

export class RequestNormalizer {
  normalize(input={}){
    const source=typeof input==='string'?{topic:input}:input||{};
    const title=source.title||source.topic||'Untitled presentation';
    const description=source.description||source.brief||'';
    const audience=source.audience||'';
    const rawIntent=source.intent||source.presentationType||source.type||'';
    const slideCount=Math.max(1,Number(source.slideCount||source.slides?.length||source.durationSlides||12)||12);
    const text=[title,description,audience,rawIntent,source.domain||'',...(source.tags||[])].join(' ');
    return {
      title,
      description,
      audience,
      domain:String(source.domain||'auto').toLowerCase(),
      intent:normalizeIntent(rawIntent),
      slideCount,
      tags:UNIQUE([...(source.tags||[]).map(v=>String(v).toLowerCase()),...tokenize(text)]),
      text:text.toLowerCase(),
      source
    };
  }
}
