#!/usr/bin/env node
import fs from 'node:fs/promises';
import {verifyPresentation} from '../CORE/BrowserVerifier.mjs';
const [file]=process.argv.slice(2);
if(!file){console.error('Usage: node BUILDER/verify.mjs presentation.html');process.exit(2)}
const report=await verifyPresentation(file);
await fs.writeFile(file.replace(/\.html?$/i,'')+'.browser.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:report.status==='blocked'?2:1;
