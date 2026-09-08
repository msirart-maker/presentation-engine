(function(V10){
  'use strict';
  class LightboxController{
    constructor({stage,overlay}){this.stage=stage;this.overlay=overlay;this.image=overlay.querySelector('img');this.title=overlay.querySelector('h2');this.caption=overlay.querySelector('p');this.source=overlay.querySelector('a');this.closeButton=overlay.querySelector('[data-v10-lightbox-close]');this.lastFocus=null;this.stageScrollTop=0}
    start(){
      this.stage.querySelectorAll('[data-v10-lightbox]').forEach(card=>{const open=event=>{if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(event.type==='keydown')event.preventDefault();this.open(card)};card.addEventListener('click',open);card.addEventListener('keydown',open)});
      V10.utils.bindActivation(this.closeButton,event=>{event.stopPropagation();this.close()});this.overlay.addEventListener('click',event=>{if(event.target===this.overlay)this.close()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.isOpen())this.close()})
    }
    isOpen(){return this.overlay.classList.contains('is-open')}
    open(card){const img=card.querySelector('img');if(!img)return;this.lastFocus=document.activeElement;this.stageScrollTop=this.stage.scrollTop;this.image.src=img.currentSrc||img.src;this.image.alt=img.alt||'';this.title.textContent=card.querySelector('h3')?.textContent||'Image';this.caption.textContent=card.dataset.v10Caption||card.querySelector('p')?.textContent||'';const url=card.dataset.v10Source||'';this.source.hidden=!url;this.source.href=url||'#';this.stage.classList.add('is-lightbox-locked');this.stage.setAttribute('aria-hidden','true');this.overlay.classList.add('is-open');this.overlay.setAttribute('aria-hidden','false');this.closeButton.focus({preventScroll:true})}
    close(){if(!this.isOpen())return;this.overlay.classList.remove('is-open');this.overlay.setAttribute('aria-hidden','true');this.image.removeAttribute('src');this.stage.classList.remove('is-lightbox-locked');this.stage.removeAttribute('aria-hidden');this.stage.scrollTop=this.stageScrollTop;this.lastFocus?.focus?.({preventScroll:true})}
  }
  V10.classes.LightboxController=LightboxController;
})(window.V10Engine);
