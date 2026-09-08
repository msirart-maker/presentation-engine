(function(V10){
  'use strict';
  class PreloaderController{
    constructor({app,timeout=6500,bus}){this.app=app;this.timeout=timeout;this.bus=bus;this.result={version:'13.5.0',status:'pending',fonts:{ready:0,failed:0,total:0},images:{ready:0,failed:0,total:0},videos:{ready:0,failed:0,total:0},timedOut:false,durationMs:0}}
    registry(){try{return JSON.parse(document.querySelector('#v13-asset-registry')?.textContent||'[]')}catch{return[]}}
    imageReady(image){if(image.complete)return image.naturalWidth?Promise.resolve():Promise.reject(new Error('Image failed'));return image.decode?image.decode():new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true})})}
    videoReady(video){if(video.readyState>=2)return Promise.resolve();return new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',reject,{once:true})})}
    fontReady(family){if(!document.fonts)return Promise.resolve();return document.fonts.load(`1em "${String(family).replace(/["\\]/g,'')}"`).then(fonts=>fonts.length?undefined:Promise.reject(new Error(`Font ${family} unavailable`)))}
    track(kind,promises){this.result[kind].total=promises.length;return Promise.allSettled(promises).then(results=>results.forEach(result=>result.status==='fulfilled'?this.result[kind].ready++:this.result[kind].failed++))}
    async ready(){
      const born=performance.now(),critical=this.registry().filter(asset=>['critical','high'].includes(asset.priority)),families=[...new Set(critical.filter(asset=>asset.type==='font'&&asset.family).map(asset=>asset.family))],images=[...this.app.querySelectorAll('img[loading="eager"], .v10-slide:first-of-type img')],videos=[...this.app.querySelectorAll('.v10-slide:first-of-type video[data-v10-video]')];
      const jobs=[this.track('fonts',families.map(family=>this.fontReady(family))),this.track('images',images.map(image=>this.imageReady(image))),this.track('videos',videos.map(video=>this.videoReady(video)))];let timer;
      await Promise.race([Promise.allSettled(jobs),new Promise(resolve=>{timer=setTimeout(()=>{this.result.timedOut=true;resolve()},this.timeout)})]);clearTimeout(timer);this.result.durationMs=Math.round(performance.now()-born);const failures=this.result.fonts.failed+this.result.images.failed+this.result.videos.failed;this.result.status=this.result.timedOut?'timeout':failures?'degraded':'ready';this.bus?.emit('preload:complete',this.result);return this.result;
    }
  }
  V10.classes.PreloaderController=PreloaderController;
})(window.V10Engine);
