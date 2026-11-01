import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const dist=path.join(root,'dist');
async function visit(dir){for(const name of await readdir(dir)){const file=path.join(dir,name);const info=await stat(file);if(info.isDirectory())await visit(file);else if(name.endsWith('.js')){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}else if(name.startsWith('.env')||/\.(pem|key)$/i.test(name))throw new Error('Private configuration must not be in dist: '+name)}}
await visit(dist);
const html=await readFile(path.join(dist,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){const url=match[1];if(/^(?:https?:|data:|mailto:|tel:|#|\/\/)/.test(url))continue;const file=path.resolve(dist,url.split(/[?#]/)[0].replace(/^\//,''));if(!file.startsWith(dist+path.sep))throw new Error('Asset escapes dist: '+url);await stat(file).catch(()=>{throw new Error('Missing local asset: '+url)})}
console.log('Website JavaScript and local asset references passed.');
