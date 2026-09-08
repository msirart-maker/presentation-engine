import assert from 'node:assert/strict';import {compareRuns} from '../BENCHMARKS/compare.mjs';
assert.equal(compareRuns({pairs:[]}).status,'unmeasured');
const run={briefSha256:'a'.repeat(64),qualityAccepted:true,provider:'synthetic-test-fixture',usageSource:'unit-test-only',inputTokens:100,outputTokens:100};
assert.equal(compareRuns({pairs:[{engine:run,direct:{...run,outputTokens:300}}]}).measuredTokenSavingsPercent,50);
assert.throws(()=>compareRuns({pairs:[{engine:run,direct:{...run,briefSha256:'b'.repeat(64)}}]}),/SHA/);
assert.throws(()=>compareRuns({pairs:[{engine:{...run,qualityAccepted:false},direct:run}]}),/acceptance/);
console.log('Benchmark contract: empty data, paired totals and invalid pairing tested with synthetic fixtures.');
