(function(V10){
  'use strict';
  class FullscreenController{
    constructor({button,state,viewport,scroll,loader,bus}){this.button=button;this.state=state;this.viewport=viewport;this.scroll=scroll;this.loader=loader;this.bus=bus;this.onChange=this.onChange.bind(this)}
    supported(){return !!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen||document.documentElement.msRequestFullscreen)}
    isFullscreen(){return !!V10.utils.fullscreenElement()}
    start(){document.documentElement.dataset.v10Fullscreen=this.isFullscreen()?'true':'false';if(!this.supported())this.button?.classList.add('is-limited');V10.utils.bindActivation(this.button,()=>this.toggle());for(const event of ['fullscreenchange','webkitfullscreenchange','MSFullscreenChange'])document.addEventListener(event,this.onChange)}
    onChange(){const active=this.isFullscreen();document.documentElement.dataset.v10Fullscreen=active?'true':'false';this.state.update({fullscreen:active},'fullscreenchange');if(this.button)this.button.textContent=active?'Exit full screen':'Full screen';this.bus.emit('fullscreen:change',{active})}
    waitForChange(expected){if(this.isFullscreen()===expected)return Promise.resolve();return new Promise(resolve=>{let timer;const events=['fullscreenchange','webkitfullscreenchange','MSFullscreenChange'];const done=()=>{if(this.isFullscreen()!==expected)return;clearTimeout(timer);events.forEach(event=>document.removeEventListener(event,done));resolve()};events.forEach(event=>document.addEventListener(event,done));timer=setTimeout(()=>{events.forEach(event=>document.removeEventListener(event,done));resolve()},1400)})}
    async toggle(){if(this.state.isTransitioning())return;const entering=!this.isFullscreen(),owner='fullscreen';if(!this.state.beginTransition(owner))return;const anchor=this.scroll.captureAnchor();this.state.saveAnchor(anchor);this.scroll.suspendSnap();
      try{await this.loader.during(async()=>{
        /* Proven sequence: capture -> request -> fullscreenchange -> settle -> restore. */
        try{
          if(entering){const request=document.documentElement.requestFullscreen?.bind(document.documentElement)||document.documentElement.webkitRequestFullscreen?.bind(document.documentElement)||document.documentElement.msRequestFullscreen?.bind(document.documentElement);if(request){const change=this.waitForChange(true);await V10.utils.timeout(request(),1200);await change}const profile=document.documentElement.dataset.v10Profile||'';try{if(/^(phone|tablet)-/.test(profile)&&screen.orientation?.lock)await V10.utils.timeout(screen.orientation.lock('landscape'),900)}catch{}}
          else{const exit=document.exitFullscreen?.bind(document)||document.webkitExitFullscreen?.bind(document)||document.msExitFullscreen?.bind(document);if(exit){const change=this.waitForChange(false);await V10.utils.timeout(exit(),1200);await change}}
        }catch(error){console.warn('Fullscreen request was declined; presentation remains active.',error)}
        await this.viewport.stabilize({timeout:950});this.scroll.restoreAnchor(anchor);
      },{label:entering?'Entering full screen':'Leaving full screen',minimum:320})}finally{this.scroll.resumeSnap();this.state.endTransition(owner)}}
  }
  V10.classes.FullscreenController=FullscreenController;
})(window.V10Engine);
