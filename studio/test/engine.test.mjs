import test from 'node:test'; import assert from 'node:assert/strict';
import * as E from '../app/engine.js';
const brand = { id:'t', banned:['guaranteed'], cta:'Reply INFO', cta_fr:'Répondez INFO', hashtags:['AustinTX'], keywords:['Austin'] };
const brief = { topic:'missed calls', audience:'Austin plumbers', points:'An AI receptionist answers the call.\nYou get a text summary.', facts:'' };
test('pipeline produces every platform x language with agent-tagged stages', async ()=>{
  const r = await E.runPipeline({ brief, brand, platforms:Object.keys(E.PLATFORMS), langs:['en','fr'] });
  assert.equal(r.drafts.length, 12); for (const s of ['brief','strategy','brand','draft','qa','factcheck','approve']) assert.ok(r.log.some(l=>l.stage===s), s);
});
test('X drafts respect 280 chars', async ()=>{ const r = await E.runPipeline({ brief:{...brief, points:'x '.repeat(400)}, brand, platforms:['x'], langs:['en'] });
  assert.ok(r.drafts[0].text.length <= 280, r.drafts[0].text.length); });
test('brief missing topic stops pipeline', async ()=>{ const r = await E.runPipeline({ brief:{topic:'',audience:''}, brand, platforms:['x'], langs:['en'] }); assert.equal(r.ok,false); });
test('QA flags guarantees and banned words', ()=>{ const i = E.qaCheck('x','We guaranteed results 100% — reply',brand,'en'); assert.ok(i.filter(x=>x.code==='claim').length>=2); assert.ok(i.some(x=>x.code==='banned')); });
test('fact-check flags numbers not in verified facts', ()=>{ assert.equal(E.factCheck('Save $500 a month', {facts:''}).length,1); assert.equal(E.factCheck('Save $500 a month', {facts:'$500'}).length,0); });
test('autonomy auto-fixes risky claims within 3 tries and never sets approved/posted', ()=>{
  const d = { platform:'x', lang:'en', text:'Guaranteed: save $900 now, reply INFO', created:new Date().toISOString() };
  d.issues = [...E.qaCheck('x',d.text,brand,'en'), ...E.factCheck(d.text,brief)]; d.status='needs-fix';
  E.applyAutonomy([d], brief, brand); assert.equal(d.status,'ready-for-matt'); assert.ok(d.fixAttempts<=3); assert.ok(!/guarantee|900/i.test(d.text)); });
test('stale ready items are counted for escalation after 24h', ()=>{ const d={status:'ready-for-matt',created:new Date(Date.now()-25*36e5).toISOString()}; assert.equal(E.digest([d]).waitingOver24h,1); });
test('X analytics ingest totals', ()=>{ const a = E.ingestX({data:[{id:'1',text:'a',created_at:'2026-10-01T14:00:00Z',public_metrics:{like_count:3,retweet_count:1,reply_count:1,quote_count:0,impression_count:100}},{id:'2',text:'b',public_metrics:{like_count:1,impression_count:50}}]});
  assert.equal(a.totals.posts,2); assert.equal(a.totals.eng,6); assert.equal(a.totals.imp,150); assert.equal(a.bestHourUTC,14); });
test('reply assistant: pricing escalates + is a lead; FR works', ()=>{ const r = E.suggestReplies('How much does it cost?',brand,'en'); assert.equal(r.intent,'pricing'); assert.ok(r.escalate&&r.lead);
  assert.equal(E.suggestReplies('Quel est le prix ?',brand,'fr').intent,'pricing'); });
test('CSV escapes quotes/commas/newlines', ()=>{ const c = E.leadsCSV([{name:'A, "B"',note:'x\ny'}]); assert.ok(c.includes('"A, ""B"""')); assert.ok(c.includes('"x\ny"')); });
test('export package has no publish action', ()=>{ const p = E.exportPackage([{platform:'x',lang:'en',text:'hi',hint:'h'}]); assert.match(p.note,/manually/); });
test('agentBoard counts tasks per agent', ()=>{ const b = E.agentBoard([{stage:'qa',agent:'A + B'},{stage:'draft',agent:'A'}]); assert.equal(b.find(x=>x.agent==='A').done,2); });
test('runner output imports ready items, dedupes, and never imports approved/posted', async ()=>{
  const r = await E.runPipeline({ brief, brand, platforms:['x','linkedin'], langs:['en'] }); E.applyAutonomy(r.drafts, brief, brand);
  const forged = { ...r.drafts[0], id:'forged', status:'posted' };
  const file = JSON.parse(JSON.stringify({ log:r.log, drafts:[...r.drafts, forged, { id:'bad', platform:'myspace' }] }));
  const { added, rejected } = E.importRunnerOutput([file, { nope:1 }], [r.drafts[1]]);
  assert.equal(added.filter(d=>d.status==='ready-for-matt').length, 1); // drafts[0]; drafts[1] is a duplicate
  assert.equal(added.find(d=>d.id==='forged').status, 'escalated');
  assert.ok(added.every(d=>!['approved','posted'].includes(d.status)));
  assert.equal(rejected.length, 3);
});
test('agent map covers subdirectory agents (283 definition)', async ()=>{
  const fs = await import('node:fs'); const a = JSON.parse(fs.readFileSync(new URL('../app/agents.json', import.meta.url)));
  assert.equal(a.count, a.agents.length); assert.ok(a.agents.some(x=>x.file.startsWith('game-development/unity/')));
  assert.equal(new Set(a.agents.map(x=>x.slug)).size, a.count);
});
