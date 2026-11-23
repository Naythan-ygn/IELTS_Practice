import { DatabaseSync, backup } from 'node:sqlite';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='data/backups',file=folder+'/pre-v2-2026-11-23.sqlite';
mkdirSync(folder,{recursive:true});
const source=new DatabaseSync('data/sprint.sqlite');
const tables=['users','profiles','attempts','study_days','mistakes','writing','recordings','vocabulary_reviews','tutor_messages'];
const digest=db=>Object.fromEntries(tables.map(t=>{const r=db.prepare('SELECT * FROM '+t+' ORDER BY rowid').all();return [t,{count:r.length,sha256:createHash('sha256').update(JSON.stringify(r)).digest('hex')}];}));
if(process.argv.includes('--verify')){const before=JSON.parse(readFileSync(folder+'/pre-v2-manifest.json','utf8'));const after=digest(source);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Original records differ from the pre-upgrade snapshot');console.log('All original table records match the pre-V2 snapshot.');}
else if(!existsSync(file)){await backup(source,file);writeFileSync(folder+'/pre-v2-manifest.json',JSON.stringify(digest(source),null,2));console.log('Created consistent pre-V2 SQLite backup and record hashes.');}
else console.log('Existing pre-V2 backup retained.');
source.close();
