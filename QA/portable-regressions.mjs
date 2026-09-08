import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['lite-smoke','intake-effective','verification-contract','improvement-store','chart-semantics','composition-range','motion-lifecycle','benchmark-contract','generation-pipeline','orchestrator-smoke','chart-specialization','readability'])execFileSync(process.execPath,[`QA/${file}.mjs`],{cwd:root,stdio:'inherit'});
console.log('Packaged regression suite passed. This suite does not certify browsers.');
