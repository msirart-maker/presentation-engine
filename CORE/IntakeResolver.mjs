import fs from 'node:fs';
const packs=JSON.parse(fs.readFileSync(new URL('../DESIGN_SYSTEM/style-packs.json',import.meta.url),'utf8')).packs;
const key=value=>String(value??'').trim().toLowerCase();
const auto=value=>/^(your call|auto|choose automatically|engine chooses|choose for the content|choose based on presentation|choose with color theory)$/.test(key(value));
const boolean=value=>typeof value==='boolean'?value:/^(yes|true)(\b|$)/.test(key(value))?true:/^(no|false)(\b|$)/.test(key(value))?false:undefined;
const styles=new Map(packs.flatMap(pack=>[pack.id,...(pack.aliases||[])].map(alias=>[key(alias),pack.id])));
for(const [alias,id] of Object.entries({'premium/minimal':'luxury-minimal','premium medical':'scientific-technical','cinematic':'cinematic-glass','editorial/technical':'swiss-editorial'}))styles.set(alias,id);
const motions={'minimal':'none','minimal motion':'none','no animation':'none','none':'none','restrained professional':'restrained','elegant and noticeable':'standard','cinematic/high-impact':'cinematic'};
const motionNames=new Set(['none','restrained','standard','cinematic','precise','geometric','snappy','analytical','organic','technical']);

// Deterministic resolution only. Free-text creative/content choices stay visible in the
// effective brief for the AI; they are never represented as implemented behavior.
export function resolveIntake(input={}){
  const request=structuredClone(input),answers=request.intake?.answers||{},applied=[],delegated=[],unresolved=[],conflicts=[];
  const assign=(id,path,value)=>{
    const parts=path.split('.');let target=request;
    for(const part of parts.slice(0,-1))target=target[part]??={};
    const leaf=parts.at(-1);
    if(target[leaf]!==undefined&&JSON.stringify(target[leaf])!==JSON.stringify(value))conflicts.push({answer:id,path,answerValue:value,explicitValue:target[leaf]});
    else {target[leaf]=value;applied.push({answer:id,path,value});}
  };
  const parse=(id,path,convert)=>{if(answers[id]===undefined||auto(answers[id]))return;const value=convert(answers[id]);if(value===undefined)unresolved.push({answer:id,value:answers[id],message:`Resolve ${id} into ${path} before generation.`});else assign(id,path,value)};
  parse('cover','options.showCover',boolean);
  for(const [id,field] of Object.entries({navigation:'showNavigation',counter:'showCounter',progress:'showProgress',replay:'showReplay',fullscreen:'showFullscreen',orientation:'orientationPrompt'}))parse(id,`options.${field}`,boolean);
  parse('design','design.stylePack',value=>styles.get(key(value)));
  parse('motion','design.motion',value=>motions[key(value)]||(motionNames.has(key(value))?key(value):undefined));
  parse('palette','design.palette',value=>typeof value==='object'&&value!==null&&!Array.isArray(value)?value:/^#[\da-f]{6}$/i.test(String(value))?{seed:value,harmony:'analogous'}:undefined);
  parse('audience','audience',value=>typeof value==='string'&&value.trim()?value.trim():undefined);
  parse('length','slideCount',value=>/^\d+( slides)?$/.test(key(value))&&Number.parseInt(value)>0&&Number.parseInt(value)<=60?Number.parseInt(value):undefined);
  if(answers.delivery!==undefined&&!auto(answers.delivery)){
    if(/offline/i.test(answers.delivery)){assign('delivery','assetPolicy.offlineRequired',true);assign('delivery','assetPolicy.remote','deny')}
    delegated.push({answer:'delivery',value:answers.delivery,responsibility:'AI selects verification viewports; responsive runtime remains enabled.'});
  }
  for(const [id,value] of Object.entries(answers))if(!['cover','navigation','counter','progress','replay','fullscreen','orientation','design','motion','palette','audience','length','delivery'].includes(id)&&!auto(value))delegated.push({answer:id,value,responsibility:'AI must author content to satisfy this choice before generation.'});
  // An explicit renderer field is the supported way to resolve free text.
  const pending=unresolved.filter(item=>{
    const path={design:'design.stylePack',motion:'design.motion',palette:'design.palette',length:'slideCount',audience:'audience'}[item.answer];
    const value=path?.split('.').reduce((obj,k)=>obj?.[k],request);
    if(value!==undefined){delegated.push({...item,resolvedBy:path});return false}return true;
  });
  return {request,report:{version:'13.5.0',applied,delegated,unresolved:pending,conflicts,status:pending.length||conflicts.length?'needs-resolution':'resolved'}};
}
export function assertResolvedIntake(input){const result=resolveIntake(input);if(result.report.status!=='resolved')throw new Error(`Intake choices need resolution: ${JSON.stringify({unresolved:result.report.unresolved,conflicts:result.report.conflicts})}`);return result;}
