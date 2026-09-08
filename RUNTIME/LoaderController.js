(function(V10){
  'use strict';
  class LoaderController{
    constructor(element){this.element=element;this.running=0}
    show(label='Adapting view'){this.running++;this.element.querySelector('strong').textContent=label;this.element.classList.add('is-active');this.element.setAttribute('aria-hidden','false')}
    hide(){this.running=Math.max(0,this.running-1);if(this.running)return;this.element.classList.remove('is-active');this.element.setAttribute('aria-hidden','true')}
    async during(work,{label='Adapting view',minimum=240}={}){this.show(label);const born=performance.now();try{return await work()}finally{await V10.utils.wait(Math.max(0,minimum-(performance.now()-born)));this.hide()}}
  }
  V10.classes.LoaderController=LoaderController;
})(window.V10Engine);
