(function(V10){
  'use strict';
  class Runtime{
    constructor(app){
      this.app=app;this.options={showCover:true,showCounter:true,showProgress:true,showNavigation:true,showReplay:true,showFullscreen:true,orientationPrompt:true,snap:'proximity',rememberSession:false,...JSON.parse(app.dataset.v10Options||'{}')};
      this.bus=new V10.classes.EventBus();this.state=new V10.classes.StateManager({rememberSession:this.options.rememberSession});this.stage=app.querySelector('#v10-stage');this.slides=new V10.classes.SlideManager(this.stage,this.state);
      this.viewport=new V10.classes.ViewportController({state:this.state,bus:this.bus,stage:this.stage});this.scroll=new V10.classes.ScrollController({stage:this.stage,slides:this.slides,state:this.state,bus:this.bus,progress:app.querySelector('#v10-progress i'),counter:app.querySelector('#v10-counter span')});
      this.charts=new V10.classes.ChartController({stage:this.stage,bus:this.bus});this.media=new V10.classes.MediaController({stage:this.stage,bus:this.bus});this.animations=new V10.classes.AnimationEngine({bus:this.bus,state:this.state,charts:this.charts,media:this.media});
      this.transitions=new V10.classes.TransitionController({slides:this.slides,scroll:this.scroll,animations:this.animations,mode:this.options.transition||'fade'});this.slides.transition=this.transitions;
      this.lightbox=new V10.classes.LightboxController({stage:this.stage,overlay:app.querySelector('#v10-lightbox')});this.reveals=new V10.classes.TapRevealController({stage:this.stage,bus:this.bus});this.uiRecipes=new V10.classes.UIRecipeController();this.navigation=new V10.classes.NavigationController({stage:this.stage,slides:this.slides,lightbox:this.lightbox});this.replay=new V10.classes.ReplayController({button:app.querySelector('#v10-replay'),slides:this.slides,animations:this.animations});this.loader=new V10.classes.LoaderController(app.querySelector('#v10-loader'));
      this.preloader=new V10.classes.PreloaderController({app,bus:this.bus});
      this.fullscreen=new V10.classes.FullscreenController({button:app.querySelector('#v10-fullscreen'),state:this.state,viewport:this.viewport,scroll:this.scroll,loader:this.loader,bus:this.bus});this.orientation=new V10.classes.OrientationController({state:this.state,viewport:this.viewport,scroll:this.scroll,loader:this.loader,bus:this.bus,prompt:app.querySelector('#v10-orientation'),enabled:this.options.orientationPrompt});
    }
    start(){
      document.documentElement.dataset.v10Snap=this.options.snap;this.applyOptions();this.viewport.start();this.charts.start();this.media.start();this.uiRecipes.start(this.stage);this.slides.slides.forEach(slide=>this.animations.prepare(slide));this.scroll.start();this.lightbox.start();this.reveals.start();this.navigation.start();this.replay.start();this.fullscreen.start();this.orientation.start();
      this.bus.on('slide:change',({slide,previous})=>{if(previous)this.animations.reset(previous);this.animations.play(slide);this.media.playSlide(slide);const phase=slide.classList.contains('phase-calm')?'var(--v10-teal)':'var(--v10-ember-soft)';this.app.querySelector('#v10-progress i').style.background=phase});
      V10.utils.bindActivation(this.app.querySelector('#v10-begin'),()=>this.begin());
      const first=this.slides.nearest();this.slides.setActive(first);if(!this.options.showCover)this.begin({loader:false});
      window.__V10_RUNTIME__=this;this.bus.emit('runtime:ready',{runtime:this});document.dispatchEvent(new CustomEvent('v10:ready',{detail:{version:V10.version}}));
    }
    applyOptions(){const map={showCounter:'#v10-counter',showProgress:'#v10-progress',showNavigation:'#v10-navigation',showReplay:'#v10-replay',showFullscreen:'#v10-fullscreen'};for(const[key,selector]of Object.entries(map))this.app.querySelector(selector).hidden=!this.options[key]}
    async begin({loader=true}={}){if(this.state.state.started)return;const enter=async()=>{const preload=await this.preloader.ready();this.app.querySelector('#v10-cover').classList.add('is-hidden');this.state.update({started:true},'begin');this.orientation.presentationStarted();this.stage.focus({preventScroll:true});await V10.utils.nextFrames(2);const slide=this.slides.nearest();this.slides.setActive(slide);this.animations.play(slide,{force:true});this.media.playSlide(slide);this.bus.emit('presentation:started',{slide,preload})};if(loader)await this.loader.during(enter,{label:'Preparing presentation',minimum:620});else await enter()}
  }
  V10.classes.Runtime=Runtime;
  const boot=()=>{const app=document.getElementById('v10-app');if(!app||app.dataset.v10Booted)return;app.dataset.v10Booted='true';new Runtime(app).start()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window.V10Engine);
