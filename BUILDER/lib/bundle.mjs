import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
export const root=path.resolve(here,'../..');

async function readMany(files){ return (await Promise.all(files.map(file=>fs.readFile(path.join(root,file),'utf8')))).join('\n\n'); }

export async function cssBundle(){
  return readMany([
    'DESIGN_SYSTEM/tokens.css','DESIGN_SYSTEM/base.css','DESIGN_SYSTEM/surfaces.css','DESIGN_SYSTEM/style-packs.css','COMPONENTS/components.css','UI_LIBRARIES/ui-recipes.css','ANIMATION/animations.css','RESPONSIVE/responsive.css','RUNTIME/runtime.css','COMPOSITIONS/compositions.css'
  ]);
}

export async function runtimeBundle(){
  return readMany([
    'RUNTIME/00-namespace.js','RUNTIME/StateManager.js','RUNTIME/SlideManager.js','RUNTIME/ViewportController.js','RUNTIME/ScrollController.js','RUNTIME/AnimationEngine.js','RUNTIME/ChartController.js','RUNTIME/MediaController.js','RUNTIME/LightboxController.js','RUNTIME/TapRevealController.js','RUNTIME/NavigationController.js','RUNTIME/ReplayController.js','RUNTIME/LoaderController.js','RUNTIME/PreloaderController.js','RUNTIME/FullscreenController.js','RUNTIME/OrientationController.js','COMPONENTS/UIRecipe/controller.js','RUNTIME/TransitionController.js','RUNTIME/Runtime.js'
  ]);
}
