import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('..',import.meta.url));
const config=JSON.parse(await readFile(new URL('../deploy.config.json',import.meta.url),'utf8'));
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.projectName)||!config.productionBranch)throw new Error('Invalid deploy.config.json');
const command=process.argv[2]||'production';
const cli=path.join(root,'node_modules','wrangler','bin','wrangler.js');
let args;
if(command==='setup')args=['pages','project','create',config.projectName,'--production-branch',config.productionBranch];
else if(command==='production'||command==='preview'){
  const check=spawnSync(process.execPath,[path.join(root,'scripts','check.mjs')],{cwd:root,stdio:'inherit'});
  if(check.status!==0)process.exit(check.status||1);
  args=['pages','deploy','dist','--project-name',config.projectName,'--branch',command==='preview'?'preview':config.productionBranch];
}else throw new Error('Choose production, preview, or setup.');
const result=spawnSync(process.execPath,[cli,...args],{cwd:root,stdio:'inherit',env:process.env});
if(result.error)throw result.error;
process.exit(result.status??1);
