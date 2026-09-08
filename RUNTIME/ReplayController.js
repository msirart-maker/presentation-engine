(function(V10){
  'use strict';
  class ReplayController{
    constructor({button,slides,animations}){this.button=button;this.slides=slides;this.animations=animations}
    start(){V10.utils.bindActivation(this.button,()=>this.replay())}
    async replay(){const slide=this.slides.nearest();if(!slide)return;this.button.classList.remove('is-spinning');void this.button.offsetWidth;this.button.classList.add('is-spinning');slide.classList.add('is-replay-reset');this.animations.reset(slide,{replay:true});await V10.utils.nextFrames(2);slide.classList.remove('is-replay-reset');this.animations.play(slide,{force:true});setTimeout(()=>this.button.classList.remove('is-spinning'),650)}
  }
  V10.classes.ReplayController=ReplayController;
})(window.V10Engine);
