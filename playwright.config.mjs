import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./QA/browser', timeout:120000, expect:{timeout:10000}, fullyParallel:true,
 forbidOnly:!!process.env.CI, retries:0, workers:process.env.CI?2:undefined,
 reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}],['junit',{outputFile:'test-results/junit.xml'}]],
 use:{baseURL:'http://127.0.0.1:4173',screenshot:'only-on-failure',trace:'retain-on-failure',video:'retain-on-failure'},
 projects:['chromium','firefox','webkit'].flatMap(browserName=>[
  {name:`${browserName}-desktop`,use:{browserName,viewport:{width:1440,height:900}}},
  {name:`${browserName}-mobile`,use:{browserName,viewport:{width:390,height:844},hasTouch:true}}
 ]),
 webServer:{command:'node QA/browser/server.mjs',port:4173,reuseExistingServer:!process.env.CI}
});
