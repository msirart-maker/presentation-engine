(function(V10){
  'use strict';
  class NavigationController{
    constructor({stage,slides,lightbox}){this.stage=stage;this.slides=slides;this.lightbox=lightbox}
    start(){
      V10.utils.bindActivation(document.querySelector('[data-v10-nav=prev]'),()=>this.slides.go(-1));V10.utils.bindActivation(document.querySelector('[data-v10-nav=next]'),()=>this.slides.go(1));
      this.stage.querySelectorAll('[data-v10-action]').forEach(button=>V10.utils.bindActivation(button,()=>{const action=button.dataset.v10Action;if(action==='next')this.slides.go(1);else if(action==='prev')this.slides.go(-1)}));
      window.addEventListener('keydown',event=>{if(this.lightbox?.isOpen())return;if(event.target.closest?.('a,button,input,textarea,select,[role=button]'))return;const next=['ArrowDown','ArrowRight','PageDown',' '].includes(event.key),prev=['ArrowUp','ArrowLeft','PageUp'].includes(event.key);if(next||prev){event.preventDefault();this.slides.go(next?1:-1)}})
    }
  }
  V10.classes.NavigationController=NavigationController;
})(window.V10Engine);
