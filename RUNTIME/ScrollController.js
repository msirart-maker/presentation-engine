(function(V10){
  'use strict';
  class ScrollController{
    constructor({stage,slides,state,bus,progress,counter}){this.stage=stage;this.slides=slides;this.state=state;this.bus=bus;this.progress=progress;this.counter=counter;this.raf=0;this.observer=null;this.visibility=new Map();this.currentSlide=null;this.scrollIdleTimer=0;this.onScroll=this.onScroll.bind(this)}
    start(){
      this.observer=new IntersectionObserver(entries=>{for(const entry of entries)this.visibility.set(entry.target,entry.intersectionRatio);let best=null,ratio=-1;for(const[slide,value]of this.visibility)if(value>ratio){ratio=value;best=slide}if(best&&ratio>0)this.activate(best,'observer')}, {root:this.stage,threshold:[0,.01,.25,.5,.75,1]});
      this.slides.slides.forEach(slide=>this.observer.observe(slide));for(const event of ['wheel','touchstart'])this.stage.addEventListener(event,()=>this.slides.transition?.cancel(),{passive:true});this.stage.addEventListener('scroll',this.onScroll,{passive:true});this.onScroll()
    }
    activate(slide,source='scroll'){if(!slide||this.slides.transition?.busy)return this.slides.indexOf(this.currentSlide);const previous=this.currentSlide;const index=this.slides.setActive(slide);this.currentSlide=slide;if(previous!==slide)this.bus.emit('slide:change',{slide,index,previous,source});return index}
    onScroll(){document.documentElement.classList.add('is-v10-scrolling');clearTimeout(this.scrollIdleTimer);this.scrollIdleTimer=setTimeout(()=>document.documentElement.classList.remove('is-v10-scrolling'),140);if(this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;const max=Math.max(1,this.stage.scrollHeight-this.stage.clientHeight),pct=Math.max(0,Math.min(1,this.stage.scrollTop/max));if(this.progress)this.progress.style.width=`${pct*100}%`;const slide=this.slides.nearest(),index=this.activate(slide,'scroll');if(this.counter)this.counter.textContent=String(index+1).padStart(2,'0');this.state.saveAnchor(this.captureAnchor())})}
    captureAnchor(){
      const slide=this.slides.nearest();if(!slide)return null;const root=this.stage.getBoundingClientRect(),rect=slide.getBoundingClientRect(),anchorY=root.top+this.stage.clientHeight*.45;
      return{slideId:slide.id,index:this.slides.indexOf(slide),offset:anchorY-rect.top,ratio:(anchorY-rect.top)/Math.max(1,rect.height)};
    }
    restoreAnchor(anchor=this.state.state.anchor){
      if(!anchor)return;const slide=this.slides.byId(anchor.slideId)||this.slides.at(anchor.index);if(!slide)return;const root=this.stage.getBoundingClientRect(),rect=slide.getBoundingClientRect(),anchorY=root.top+this.stage.clientHeight*.45;const preserved=Number.isFinite(anchor.offset)?anchor.offset:(Number.isFinite(anchor.ratio)?anchor.ratio*rect.height:0);this.stage.scrollTo({top:Math.round(this.stage.scrollTop+rect.top-(anchorY-preserved)),behavior:'auto'});this.activate(slide,'restore');this.onScroll()
    }
    suspendSnap(){document.documentElement.dataset.v10PreviousSnap=document.documentElement.dataset.v10Snap||'proximity';document.documentElement.dataset.v10Snap='none'}
    resumeSnap(){document.documentElement.dataset.v10Snap=document.documentElement.dataset.v10PreviousSnap||'proximity';delete document.documentElement.dataset.v10PreviousSnap}
    stop(){this.observer?.disconnect();this.stage.removeEventListener('scroll',this.onScroll);clearTimeout(this.scrollIdleTimer);document.documentElement.classList.remove('is-v10-scrolling')}
  }
  V10.classes.ScrollController=ScrollController;
})(window.V10Engine);
