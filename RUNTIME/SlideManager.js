(function(V10){
  'use strict';
  class SlideManager{
    constructor(stage,state){this.stage=stage;this.state=state;this.slides=[...stage.querySelectorAll('.v10-slide')];this.indexById=new Map(this.slides.map((slide,index)=>[slide.id,index]))}
    count(){return this.slides.length}
    at(index){return this.slides[Math.max(0,Math.min(this.slides.length-1,index))]}
    indexOf(slide){return this.slides.indexOf(slide)}
    byId(id){const index=this.indexById.get(id);return index===undefined?null:this.slides[index]}
    active(){return this.byId(this.state.state.activeSlideId)||this.at(this.state.state.activeSlideIndex)||this.slides[0]}
    nearest(){
      const stageRect=this.stage.getBoundingClientRect(),anchor=stageRect.top+this.stage.clientHeight*.5;let best=this.slides[0],bestDistance=Infinity;
      for(const slide of this.slides){const rect=slide.getBoundingClientRect();if(rect.top<=anchor&&rect.bottom>anchor)return slide;const distance=Math.min(Math.abs(rect.top-anchor),Math.abs(rect.bottom-anchor));if(distance<bestDistance){bestDistance=distance;best=slide}}
      return best;
    }
    setActive(slide){if(!slide)return;const index=this.indexOf(slide);this.slides.forEach(item=>item.classList.toggle('is-active',item===slide));this.state.setActive(slide,index);return index}
    goTo(target,{behavior='smooth',align='start'}={}){const slide=typeof target==='number'?this.at(target):typeof target==='string'?this.byId(target):target;if(!slide)return;if(this.transition&&behavior!=='instant')return this.transition.navigate(slide);this.setActive(slide);slide.scrollIntoView({behavior,block:align});return slide}
    go(delta,options){return this.goTo(this.indexOf(this.transition?.target||this.nearest())+delta,options)}
  }
  V10.classes.SlideManager=SlideManager;
})(window.V10Engine);
