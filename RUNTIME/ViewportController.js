(function(V10){
  'use strict';
  class ViewportController{
    constructor({state,bus,stage}){this.state=state;this.bus=bus;this.stage=stage;this.lastWidth=0;this.lastHeight=0;this.lastOrientation='';this.stableLandscapeHeight=null;this.timer=0;this.onResize=this.onResize.bind(this)}
    metrics(){const vv=window.visualViewport;return{width:Math.max(1,vv?.width||innerWidth),height:Math.max(1,vv?.height||innerHeight)}}
    orientation(metrics=this.metrics()){return metrics.width>=metrics.height?'landscape':'portrait'}
    classify(next){const orientation=this.orientation(next),widthChanged=Math.abs(next.width-this.lastWidth)>36,orientationChanged=Boolean(this.lastOrientation)&&orientation!==this.lastOrientation;return{orientation,widthChanged,orientationChanged,chromeResize:V10.utils.isCoarse()&&!V10.utils.fullscreenElement()&&!widthChanged&&!orientationChanged&&orientation===this.lastOrientation}}
    isBrowserChromeResize(next){return this.classify(next).chromeResize}
    apply(force=false,source='resize'){
      const metrics=this.metrics(),classification=this.classify(metrics),{orientation,widthChanged,orientationChanged}=classification;
      if(!force&&this.isBrowserChromeResize(metrics))return false;
      let height=metrics.height;
      if(V10.utils.isCoarse()&&orientation==='landscape'&&!V10.utils.fullscreenElement()){
        if(this.stableLandscapeHeight===null){const shortEdge=Math.min(Number(screen.availWidth||screen.width||height),Number(screen.availHeight||screen.height||height));this.stableLandscapeHeight=Math.max(height,Math.min(shortEdge,height+96))}
        height=this.stableLandscapeHeight;
      }else this.stableLandscapeHeight=null;
      document.documentElement.style.setProperty('--v10-vh',`${height*.01}px`);
      document.documentElement.dataset.v10Orientation=orientation;
      const short=Math.min(metrics.width,height),long=Math.max(metrics.width,height);let profile;
      if(short<620)profile=`phone-${orientation}`;else if(V10.utils.isCoarse()&&short<=1100&&long<=1700)profile=`tablet-${orientation}`;else if(metrics.width>=1200&&height>=700&&!V10.utils.isCoarse())profile='room';else profile=`desktop-${orientation}`;
      document.documentElement.dataset.v10Profile=profile;
      this.lastWidth=metrics.width;this.lastHeight=height;this.lastOrientation=orientation;
      const layoutChanged=force||widthChanged||orientationChanged;this.state.update({viewport:{width:metrics.width,height},orientation},'viewport');this.bus.emit('viewport',{...metrics,height,orientation,profile,layoutChanged,widthChanged,orientationChanged,source});return true;
    }
    onResize(){clearTimeout(this.timer);const next=this.metrics();if(this.isBrowserChromeResize(next))return;this.timer=setTimeout(()=>this.apply(false,'resize'),90)}
    async stabilize({timeout=900}={}){
      let previous=this.metrics(),stable=0,start=performance.now();
      while(performance.now()-start<timeout){await V10.utils.wait(70);const next=this.metrics();if(Math.abs(next.width-previous.width)<2&&Math.abs(next.height-previous.height)<2)stable++;else stable=0;previous=next;if(stable>=2)break}
      this.apply(true,'stabilize');await V10.utils.nextFrames(2);return this.metrics();
    }
    start(){this.apply(true,'initial');(window.visualViewport||window).addEventListener('resize',this.onResize,{passive:true});if(window.visualViewport)window.addEventListener('resize',this.onResize,{passive:true})}
    stop(){(window.visualViewport||window).removeEventListener('resize',this.onResize);if(window.visualViewport)window.removeEventListener('resize',this.onResize)}
  }
  V10.classes.ViewportController=ViewportController;
})(window.V10Engine);
