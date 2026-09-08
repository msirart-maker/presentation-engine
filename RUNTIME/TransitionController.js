(function(V10){
 'use strict';
 class TransitionController{
  constructor({slides,scroll,animations,mode='fade'}){this.slides=slides;this.scroll=scroll;this.animations=animations;this.mode=mode;this.serial=0;this.running=[];this.busy=false;this.target=null}
  cancel(){this.serial++;for(const animation of this.running)animation.cancel();this.running=[];this.busy=false;this.target=null}
  async navigate(target){
   this.cancel();const token=this.serial,previous=this.slides.nearest();this.target=target;
   if(previous===target){this.target=null;return target}
   this.busy=true;
   const reduced=this.animations.reduced||this.mode==='none',direction=this.slides.indexOf(target)>this.slides.indexOf(previous)?1:-1;
   const animate=async(element,frames,duration)=>{if(reduced||!element.animate)return;const animation=element.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'none'});this.running.push(animation);try{await animation.finished}catch{}};
   await this.animations.exit(previous);
   if(token!==this.serial)return;
   await animate(previous,[{opacity:1,transform:'none'},{opacity:0,transform:this.mode==='slide'?`translateX(${-direction*24}px)`:'none'}],140);
   if(token!==this.serial)return;
   this.slides.stage.scrollTo({top:target.offsetTop,behavior:'instant'});
   this.busy=false;this.scroll.activate(target,'navigation');this.scroll.onScroll();
   await animate(target,[{opacity:0,transform:this.mode==='slide'?`translateX(${direction*24}px)`:'none'},{opacity:1,transform:'none'}],220);
   if(token===this.serial){this.running=[];this.target=null}
   return target;
  }
 }
 V10.classes.TransitionController=TransitionController;
})(window.V10Engine);
