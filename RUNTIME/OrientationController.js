(function(V10){
  'use strict';
  class OrientationController{
    constructor({state,viewport,scroll,loader,bus,prompt,enabled=true}){this.state=state;this.viewport=viewport;this.scroll=scroll;this.loader=loader;this.bus=bus;this.prompt=prompt;this.enabled=enabled;this.dismissed=false;this.timer=0;this.pendingKind='orientation';this.suppressUntil=0;this.onChange=this.onChange.bind(this)}
    portraitPortable(){const profile=document.documentElement.dataset.v10Profile||'';return/^(phone|tablet)-portrait$/.test(profile)}
    syncPrompt(){const show=this.enabled&&!this.dismissed&&!this.state.state.started&&this.portraitPortable();this.prompt.classList.toggle('is-visible',show);this.prompt.setAttribute('aria-hidden',show?'false':'true')}
    start(){this.prompt.querySelectorAll('[data-v10-dismiss]').forEach(button=>V10.utils.bindActivation(button,()=>{this.dismissed=true;this.syncPrompt()}));window.addEventListener('orientationchange',this.onChange,{passive:true});this.bus.on('fullscreen:change',()=>{this.suppressUntil=performance.now()+1600;clearTimeout(this.timer)});this.bus.on('viewport',payload=>{this.syncPrompt();if(payload.layoutChanged&&payload.source!=='initial'&&!this.state.isTransitioning())this.schedule(payload.orientationChanged?'orientation':'reflow')});requestAnimationFrame(()=>this.syncPrompt())}
    onChange(){this.schedule('orientation')}
    schedule(kind='orientation'){if(performance.now()<this.suppressUntil)return;this.pendingKind=kind;clearTimeout(this.timer);this.timer=setTimeout(()=>this.transition(this.pendingKind),70)}
    async transition(kind){if(this.state.isTransitioning())return;const owner='orientation';if(!this.state.beginTransition(owner))return;const anchor=this.state.pendingLayoutAnchor||this.state.state.anchor||this.scroll.captureAnchor();this.state.saveAnchor(anchor);this.scroll.suspendSnap();const work=async()=>{await this.viewport.stabilize({timeout:1100});this.scroll.restoreAnchor(anchor);this.syncPrompt()};try{if(kind==='orientation'||V10.utils.isCoarse())await this.loader.during(work,{label:kind==='orientation'?'Rotating presentation':'Adapting viewport',minimum:300});else await work()}finally{this.scroll.resumeSnap();this.state.pendingLayoutAnchor=null;this.state.endTransition(owner);this.scroll.onScroll()}}
    presentationStarted(){this.dismissed=true;this.syncPrompt()}
  }
  V10.classes.OrientationController=OrientationController;
})(window.V10Engine);
