import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('SHOWCASE');
http.createServer(async(req,res)=>{
 try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html':'application/json');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}
}).listen(4173,'127.0.0.1');
