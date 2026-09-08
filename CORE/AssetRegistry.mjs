import path from 'node:path';

const external=src=>/^(https?:|data:|blob:|#|\/\/)/i.test(src||'');
const extension=src=>path.extname(String(src||'').split(/[?#]/)[0]).toLowerCase();
const inferType=(src,explicit)=>{if(explicit)return explicit;const value=String(src||'');if(/^data:font\//i.test(value))return'font';if(/^data:video\//i.test(value))return'video';if(/^data:audio\//i.test(value))return'audio';const ext=extension(src);return['.woff','.woff2','.ttf','.otf'].includes(ext)?'font':['.mp4','.webm','.mov','.m4v'].includes(ext)?'video':['.mp3','.wav','.ogg','.m4a'].includes(ext)?'audio':'image'};

export class AssetRegistry {
  collect(schema={}){
    const records=[];
    const add=(asset,defaults={})=>{
      const descriptor=typeof asset==='string'?{src:asset}:asset||{},src=descriptor.src||descriptor.path;if(!src)return;
      const priority=descriptor.priority||defaults.priority||'normal',existing=records.find(item=>item.src===src&&item.type===inferType(src,descriptor.type));
      if(existing){if(priority==='critical')existing.priority='critical';existing.owners=[...new Set([...existing.owners,...(defaults.owner?[defaults.owner]:[])])];return existing}
      const record={id:descriptor.id||`asset-${String(records.length+1).padStart(3,'0')}`,src,type:inferType(src,descriptor.type),priority,owners:defaults.owner?[defaults.owner]:['presentation'],alt:descriptor.alt||defaults.alt||'',source:external(src)?'external':'local',family:descriptor.family||'',weight:descriptor.weight||'400',style:descriptor.style||'normal',preload:descriptor.preload!==false,embed:descriptor.embed!==false};records.push(record);return record;
    };
    (schema.assets||[]).forEach((asset,index)=>add(asset,{priority:index<2?'critical':'normal'}));
    for(const[slideIndex,slide]of (schema.slides||[]).entries())for(const component of slide.components||[]){
      if(component.type==='HeroScene'){
        add(component.data?.image,{priority:slideIndex===0?'critical':'high',owner:slide.id,alt:component.data?.image?.alt});
        add(component.data?.video,{priority:slideIndex===0?'critical':'high',owner:slide.id,alt:component.data?.video?.alt});
        if(component.data?.video?.poster)add({src:component.data.video.poster,type:'image'},{priority:'high',owner:slide.id,alt:component.data.video.alt});
      }
      for(const image of component.data?.images||[])add(image,{priority:slideIndex<2?'high':'normal',owner:slide.id,alt:image.alt});
    }
    return records;
  }
}
