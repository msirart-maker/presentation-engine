(function(V10){
  'use strict';
  class TapRevealController{
    constructor({stage,bus}){this.stage=stage;this.bus=bus;this.items=[];this.onOutside=this.onOutside.bind(this)}
    start(){
      this.items=[...this.stage.querySelectorAll('[data-v10-reveal]')];
      this.items.forEach(item=>{const toggle=event=>{if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(event.type==='keydown')event.preventDefault();this.set(item,!item.classList.contains('is-revealed'))};item.addEventListener('click',toggle);item.addEventListener('keydown',toggle)});
      document.addEventListener('pointerdown',this.onOutside,{passive:true});this.bus?.on('slide:change',()=>this.closeAll());
    }
    set(item,open){this.items.forEach(other=>{const active=other===item&&open;other.classList.toggle('is-revealed',active);other.setAttribute('aria-expanded',active?'true':'false')})}
    onOutside(event){if(!event.target.closest?.('[data-v10-reveal]'))this.closeAll()}
    closeAll(){this.items.forEach(item=>{item.classList.remove('is-revealed');item.setAttribute('aria-expanded','false')})}
    stop(){document.removeEventListener('pointerdown',this.onOutside);this.closeAll()}
  }
  V10.classes.TapRevealController=TapRevealController;
})(window.V10Engine);
