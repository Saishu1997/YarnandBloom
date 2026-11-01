import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return}const file=await readFile(p===root?path.join(root,'index.html'):p);res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','jpg':'image/jpeg','svg':'image/svg+xml'})[p===root?'html':p.split('.').pop()]||'application/octet-stream');res.end(file)}catch{res.writeHead(404);res.end('Not found')}}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(process.env.PORT||4173)));
