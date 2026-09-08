#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.resolve(process.argv[2]||path.join(root,'..','V13.5_Master_Engine-updated.zip'));
if(destination.startsWith(root+path.sep))throw new Error('Choose an archive destination outside the runtime directory');
execFileSync(process.execPath,['ENGINE_DIAGNOSTICS/diagnose.mjs'],{cwd:root,stdio:'inherit'});
execFileSync(process.execPath,['QA/portable-regressions.mjs'],{cwd:root,stdio:'inherit'});
await fs.rm(destination,{force:true});
execFileSync('zip',['-qr',destination,path.basename(root),'-x','*/node_modules/*','*/DIST/*','*.lock','*.tmp'],{cwd:path.dirname(root),stdio:'inherit'});
console.log(destination);
