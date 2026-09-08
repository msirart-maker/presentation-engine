(function(V10){
  'use strict';
  class UIRecipeController{
    start(root){for(const detail of root.querySelectorAll?.('.v13-ui-accordion details')||[])detail.addEventListener('toggle',()=>{if(!detail.open)return;for(const sibling of detail.parentElement.querySelectorAll('details[open]'))if(sibling!==detail)sibling.open=false})}
  }
  V10.classes.UIRecipeController=UIRecipeController;
})(window.V10Engine);
