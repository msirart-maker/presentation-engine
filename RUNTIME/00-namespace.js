(function(global){
  'use strict';
  const V10=global.V10Engine=global.V10Engine||{version:'13.5.0',classes:{},utils:{}};
  class EventBus{
    constructor(){this.listeners=new Map()}
    on(name,handler){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(handler);return()=>this.off(name,handler)}
    off(name,handler){this.listeners.get(name)?.delete(handler)}
    emit(name,payload){for(const handler of this.listeners.get(name)||[]){try{handler(payload)}catch(error){setTimeout(()=>{throw error})}}}
  }
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  const nextFrames=async(count=2)=>{while(count--)await raf()};
  const timeout=(promise,ms=1200)=>Promise.race([Promise.resolve(promise),wait(ms)]);
  const isCoarse=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  const fullscreenElement=()=>document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement||null;
  const bindActivation=(element,handler)=>{
    if(!element)return()=>{};let lastDirect=-1000;
    const activate=event=>{const now=performance.now();if(event.type==='click'&&now-lastDirect<550)return;if(event.type!=='click')lastDirect=now;if(event.cancelable)event.preventDefault();handler(event)};
    const direct=window.PointerEvent?'pointerup':'touchend';element.addEventListener(direct,activate,{passive:false});element.addEventListener('click',activate);
    return()=>{element.removeEventListener(direct,activate);element.removeEventListener('click',activate)};
  };
  Object.assign(V10.classes,{EventBus});Object.assign(V10.utils,{wait,raf,nextFrames,timeout,isCoarse,fullscreenElement,bindActivation});
})(window);
