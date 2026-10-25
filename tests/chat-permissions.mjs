// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite module.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
 create role anon; create role authenticated;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb,unique(bucket_id,name));
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to authenticated,anon;
 grant execute on function auth.uid() to authenticated,anon;
 grant select,insert,delete on storage.objects to authenticated;
`);
await db.exec(await readFile(new URL('../supabase/collaboration-setup.sql',import.meta.url),'utf8'));
const migration = await readFile(new URL('../supabase/collaboration-chat-setup.sql',import.meta.url),'utf8');
await db.exec(migration); await db.exec(migration); // repeatable migration
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222', C='33333333-3333-4333-8333-333333333333';
const R='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', P='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const M='cccccccc-cccc-4ccc-8ccc-cccccccccccc', F='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
await db.query('insert into auth.users values($1),($2),($3)',[A,B,C]);
await db.query("insert into collaboration_requests(id,sender_id,recipient_id,message,status) values($1,$2,$3,'accepted test','accepted'),($4,$2,$3,'pending test','pending')",[R,A,B,P]);
async function as(uid){await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]); await db.exec('set role authenticated');}
async function denied(fn){let failed=false;try{await fn();}catch{failed=true;}assert(failed,'Expected access denied');}
const send=(id,req,body,name=null)=>db.query('select send_collaboration_message($1,$2,$3,$4)',[id,req,body,name]);
await as(A);
await send(M,R,'Hello'); await send(M,R,'Hello');
assert.equal((await db.query('select * from collaboration_messages')).rows.length,1);
await denied(()=>send(M,R,'Changed payload'));
await denied(()=>send(F,P,'Not accepted'));
await denied(()=>send(F,R,''));
await denied(()=>send(F,R,'x'.repeat(4001)));
await denied(()=>send(F,R,'','missing.wav'));
await denied(()=>db.query('insert into collaboration_messages(id,request_id,sender_id,body) values($1,$2,$3,$4)',[F,R,B,'Forged sender']));
const path=`${R}/${A}/${F}`;
await db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)',['collaboration-files',path,{size:2048}]);
await send(F,R,'Demo','demo.wav');
await db.query('delete from storage.objects where name=$1',[path]);
assert.equal((await db.query('select * from storage.objects')).rows.length,1,'Published file cannot be deleted');
await as(B);
assert.equal((await db.query('select * from collaboration_messages')).rows.length,2);
assert.equal((await db.query('select * from storage.objects')).rows.length,1);
await denied(()=>db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)',['collaboration-files',`${R}/${A}/${M}`,{size:2}]));
await as(C);
assert.equal((await db.query('select * from collaboration_messages')).rows.length,0);
assert.equal((await db.query('select * from storage.objects')).rows.length,0);
await denied(()=>send('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',R,'Intruder'));
await denied(()=>db.query('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3)',['collaboration-files',`${R}/${C}/${M}`,{size:2}]));
await db.exec('reset role; set role anon');
await denied(()=>db.query('select * from collaboration_messages'));
await denied(()=>send(M,R,'Anonymous'));
await db.exec('reset role');
assert.equal((await db.query("select public,file_size_limit from storage.buckets where id='collaboration-files'")).rows[0].public,false);
console.log('PASS: migration repeatability, text, attachments, idempotency, participant isolation, pending/anonymous rejection, forged sender/path rejection, published-file protection.');
await db.close();
