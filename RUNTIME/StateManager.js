(function(V10){
  'use strict';
  class StateManager{
    constructor({rememberSession=false,key='v10-presentation-state'}={}){
      this.rememberSession=rememberSession;this.key=key;this.bus=new V10.classes.EventBus();this.transitionOwner=null;
      this.state={started:false,activeSlideId:null,activeSlideIndex:0,animationRuns:{},fullscreen:false,orientation:innerWidth>=innerHeight?'landscape':'portrait',viewport:{width:innerWidth,height:innerHeight},anchor:null};
      if(rememberSession)this.restoreSession();
    }
    snapshot(){return typeof structuredClone==='function'?structuredClone(this.state):JSON.parse(JSON.stringify(this.state))}
    update(patch,reason='update'){this.state={...this.state,...patch};this.persist();this.bus.emit('change',{state:this.snapshot(),reason});return this.state}
    setActive(slide,index){if(this.state.activeSlideId===slide?.id&&this.state.activeSlideIndex===index)return;this.update({activeSlideId:slide?.id||null,activeSlideIndex:index},'active-slide')}
    markAnimation(slideId,complete){this.state.animationRuns[slideId]=(this.state.animationRuns[slideId]||0)+1;if(complete)this.persist()}
    beginTransition(owner){if(this.transitionOwner&&this.transitionOwner!==owner)return false;this.transitionOwner=owner;this.bus.emit('transition:start',{owner});return true}
    endTransition(owner){if(this.transitionOwner!==owner)return;this.transitionOwner=null;this.bus.emit('transition:end',{owner})}
    isTransitioning(){return !!this.transitionOwner}
    saveAnchor(anchor){this.state.anchor=anchor;this.persist()}
    persist(){if(!this.rememberSession)return;try{sessionStorage.setItem(this.key,JSON.stringify(this.state))}catch{}}
    restoreSession(){try{const saved=JSON.parse(sessionStorage.getItem(this.key)||'null');if(saved&&typeof saved==='object')this.state={...this.state,...saved,started:false}}catch{}}
  }
  V10.classes.StateManager=StateManager;
})(window.V10Engine);
