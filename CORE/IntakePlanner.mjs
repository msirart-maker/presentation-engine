import {resolveIntake} from './IntakeResolver.mjs';
const present=value=>value!==undefined&&value!==null&&String(value).trim()!=='';
const text=value=>String(value||'').toLowerCase();

export const INTAKE_POLICY=Object.freeze({
  version:'13.5.0',
  default:'ask-before-generation',
  bypassPhrases:['proceed without questions','skip questions','use your judgment and proceed','no questions'],
  answerFallback:'Your call',
  delivery:'Ask one concise bundled questionnaire. Do not interrogate one question at a time unless the user requests that style.'
});

const QUESTIONS=Object.freeze([
  {id:'audience',category:'content',prompt:'Who is the audience, and what should they be able to do or understand afterward?',choices:['General audience','Professional audience','Specialist/academic']},
  {id:'length',category:'structure',prompt:'How long should it be?',choices:['10–12 slides','15–20 slides','Choose for the content']},
  {id:'design',category:'design',prompt:'Which visual direction should lead the presentation?',choices:['Choose automatically','Premium/minimal','Cinematic','Editorial/technical'],hint:'The user may name any style or describe a custom visual identity.'},
  {id:'palette',category:'design',prompt:'Do you want a particular palette, accent color, or brand color?',choices:['Choose with color theory','Dark with restrained accents','Light and clean','I will specify colors']},
  {id:'cover',category:'experience',prompt:'Should the exported HTML open with a Begin/cover screen?',choices:['Yes — show Begin screen','No — open directly','Choose based on presentation']},
  {id:'opening',category:'story',prompt:'What kind of opening should it use?',choices:['Immediate key message','Cinematic hook','Case/scenario opening','Conventional title opening']},
  {id:'depth',category:'content',prompt:'How detailed and evidence-heavy should the content be?',choices:['Concise overview','Practical working detail','Full specialist depth']},
  {id:'visuals',category:'media',prompt:'Which visual elements should be emphasized?',choices:['Engine chooses','Charts and diagrams','Images and visual storytelling','Balanced mix']},
  {id:'motion',category:'motion',prompt:'How animated should it feel?',choices:['Restrained professional','Elegant and noticeable','Cinematic/high-impact','Minimal motion']},
  {id:'delivery',category:'experience',prompt:'Where will it mainly be viewed?',choices:['Projector/desktop','Phone and tablet','Both equally','Standalone offline file']},
  {id:'sources',category:'evidence',prompt:'Should it use supplied material only, or may the AI research and cite current sources?',choices:['Use supplied content only','Research current authoritative sources','Mix supplied and researched sources']}
]);

const DOMAIN_QUESTIONS=Object.freeze({
  medical:[
    {id:'medical_basis',category:'evidence',prompt:'Which guideline, society, or evidence basis should anchor the medical content?',choices:['Current international guidelines','A named guideline I will provide','Use supplied hospital protocol']},
    {id:'medical_protocols',category:'content',prompt:'Should it include practical protocols, doses, calculations, and an algorithm?',choices:['Yes — full practical protocol','Key management steps only','Conceptual/academic focus']}
  ],
  business:[{id:'business_decision',category:'content',prompt:'What decision, approval, or action should the deck drive?',choices:['Inform','Recommend a decision','Secure approval/investment']}],
  architecture:[{id:'architecture_focus',category:'content',prompt:'Should the story prioritize engineering, design history, urban impact, or commercial performance?',choices:['Engineering','Design/history','Urban impact','Balanced']}],
  science:[{id:'science_level',category:'content',prompt:'Should methods, uncertainty, and limitations be shown explicitly?',choices:['Yes — research standard','Key methods only','Public explanation']}]
});

export class IntakePlanner {
  plan(request={},options={}){
    const resolved=resolveIntake(request);request=resolved.request;
    const intake=request.intake||{};
    if(resolved.report.status!=='resolved')return {version:'13.5.0',status:'choices-need-resolution',questions:[],resolution:resolved.report,known:this.known(request)};
    if(['complete','bypassed'].includes(intake.status))return{version:'13.5.0',status:'ready',policy:INTAKE_POLICY,questions:[],known:this.known(request),intake};
    const missing=[];
    if(!present(request.audience))missing.push('audience');
    if(!present(request.slideCount)&&!present(request.durationSlides))missing.push('length');
    if(!present(request.design?.stylePack)&&!present(request.design?.pack)&&!present(request.design?.mood)&&!present(request.mood))missing.push('design');
    if(!request.design?.palette&&!request.theme?.colors)missing.push('palette');
    if(request.options?.showCover===undefined)missing.push('cover');
    if(!present(request.opening?.style)&&!present(request.opening?.mode))missing.push('opening');
    if(!present(intake.answers?.depth))missing.push('depth');
    if(!present(intake.answers?.visuals)&&!(request.images?.length||request.charts?.length))missing.push('visuals');
    if(!present(intake.answers?.motion)&&!present(request.design?.motion))missing.push('motion');
    if(!present(intake.answers?.delivery))missing.push('delivery');
    if(!present(intake.answers?.sources)&&!(request.references?.length))missing.push('sources');
    const domain=this.domain(request),domainQuestions=DOMAIN_QUESTIONS[domain]||[];
    const questions=[...QUESTIONS.filter(question=>missing.includes(question.id)),...domainQuestions.filter(question=>!present(intake.answers?.[question.id]))];
    const max=Number.isInteger(options.maxQuestions)?options.maxQuestions:14;
    return{version:'13.5.0',status:questions.length?'questions-required':'ready',policy:INTAKE_POLICY,domain,questions:questions.slice(0,max),known:this.known(request),instructions:'Ask these together in one concise response. Accept free text or “Your call.” After the user answers, summarize the choices, set intake.status to complete, and generate without another approval round unless a safety-critical fact is missing.'};
  }

  domain(request={}){const source=text(`${request.domain||''} ${request.title||request.topic||''} ${request.description||request.brief||''}`);if(/medical|clinical|patient|disease|treatment|emergency|medicine|guideline/.test(source))return'medical';if(/business|market|revenue|strategy|invest/.test(source))return'business';if(/architect|building|urban|skyscraper|construction/.test(source))return'architecture';if(/science|research|laboratory|experiment|physics|biology/.test(source))return'science';return'general'}
  known(request={}){return{title:request.title||request.topic||null,audience:request.audience||null,slideCount:request.slideCount||request.durationSlides||null,stylePack:request.design?.stylePack||request.design?.pack||null,showCover:request.options?.showCover,domain:this.domain(request)}}
  formatForChat(plan){if(plan.status==='choices-need-resolution')return `Resolve the following choices before generation: ${JSON.stringify(plan.resolution)}`;if(plan.status==='ready')return'Intake complete. The presentation can be generated.';return['Before I build it, please choose below. “Your call” is valid for any item.','',...plan.questions.map((question,index)=>`${index+1}. ${question.prompt}\n   ${question.choices.join(' · ')}`)].join('\n')}
}
