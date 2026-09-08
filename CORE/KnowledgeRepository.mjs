import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const DEFAULT_URL=new URL('../KNOWLEDGE_INDEX/v13-runtime-index.json',import.meta.url);
const DOMAIN_PACKS_URL=new URL('../DOMAIN_PACKS/domain-packs-v13.3.json',import.meta.url);
const BLUEPRINTS_URL=new URL('../PRESENTATION_BLUEPRINTS/blueprints-v13.3.json',import.meta.url);
const tokens=value=>new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
const searchable=item=>[item?.id,item?.name,item?.purpose,item?.use,...(item?.intents||[]),...(item?.beats||[]),...(item?.elements||[])].filter(Boolean).join(' ');
const overlap=(a,b)=>{const aa=tokens(a),bb=tokens(b);let n=0;for(const item of aa)if(bb.has(item))n++;return n};

export class KnowledgeRepository {
  constructor(options={}){
    const file=options.indexPath||fileURLToPath(DEFAULT_URL);
    this.index=JSON.parse(fs.readFileSync(file,'utf8'));
    const packs=JSON.parse(fs.readFileSync(fileURLToPath(DOMAIN_PACKS_URL),'utf8'));
    const blueprints=JSON.parse(fs.readFileSync(fileURLToPath(BLUEPRINTS_URL),'utf8'));
    this.index.domainPacks={...(this.index.domainPacks||{}),...(packs.domainPacks||{})};
    this.index.blueprints=blueprints.blueprints||this.index.blueprints||[];
  }
  blueprints(domain){return (this.index.blueprints||[]).filter(x=>x.domain===domain)}
  scenes(domain){return (this.index.scenes||[]).filter(x=>x.category===domain||x.category==='universal'||!x.category)}
  recipes(domain){return (this.index.recipes||[]).filter(x=>(x.bestDomains||[]).includes(domain)||(x.bestDomains||[]).includes('all'))}
  domainPack(domain){return this.index.domainPacks?.[domain]||{domain,patterns:[]}}
  bugs(){return this.index.browserLessons||[]}
  failures(){return this.index.failurePatterns||[]}
  memories(domain){return (this.index.memories||[]).filter(x=>x.domain===domain||x.domain==='universal')}
  findScene(id,domain){
    const exact=(this.index.scenes||[]).find(x=>x.id===id);if(exact)return exact;
    const ranked=this.scenes(domain).map(scene=>({scene,score:overlap(searchable(scene),id)})).sort((a,b)=>b.score-a.score);
    return ranked[0]?.score>0?ranked[0].scene:{id,category:domain,beats:[],purpose:id.replace(/_/g,' ')};
  }
  selectBlueprint(domain,intent='auto'){
    const candidates=this.blueprints(domain);
    if(!candidates.length){
      return {id:'general_story',domain:'general',slides:['opening','context','evidence','turning_point','resolution','closing']};
    }
    const scored=candidates.map(item=>({item,score:(intent!=='auto'&&item.id===intent?100:0)+overlap(item.id,intent)*20+overlap(item.id,`${domain} ${intent}`)*5})).sort((a,b)=>b.score-a.score);
    return scored[0].item;
  }
  selectRecipe(stageId,domain){
    const stage=String(stageId||'').toLowerCase();
    const preferred=
      (/turning_point|diagnos/.test(stage)?'clinical_turning_point':
      /mechanism|pathway|process|method/.test(stage)?'mechanism_explanation':
      /insight|strategy/.test(stage)?'executive_insight':
      /closing|lesson|take_home|legacy|future|calm_after/.test(stage)?'cinematic_closing':null);
    if(preferred){const hit=this.recipes(domain).find(recipe=>recipe.id===preferred);if(hit)return hit}
    const candidates=this.recipes(domain).map(recipe=>({recipe,score:overlap(recipe.id,stage)})).sort((a,b)=>b.score-a.score);
    return candidates[0]?.score>=2?candidates[0].recipe:null;
  }
}
