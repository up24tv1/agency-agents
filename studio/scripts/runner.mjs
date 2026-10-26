// Unattended runner (Tier A/B): processes every brief in studio/queue/*.json, runs the agency pipeline + autonomy policy,
// writes deliverables to studio/out/<date>/ and a digest. It NEVER posts, sends or spends (Tier C stays with Matt).
// Usage: node studio/scripts/runner.mjs   (schedule with cron or a bot routine — needs Matt's OK to install a schedule)
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
import { runPipeline, applyAutonomy, digest } from '../app/engine.js';
import { makeProvider } from '../app/model.js';
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const qdir = path.join(root,'queue'); const day = new Date().toISOString().slice(0,10); const out = path.join(root,'out',day);
const roles = JSON.parse(fs.readFileSync(path.join(root,'app/agents.json'),'utf8'));
const provider = makeProvider(process.env.STUDIO_MODEL_BASE ? { mode:'openai-compatible', base:process.env.STUDIO_MODEL_BASE, model:process.env.STUDIO_MODEL||'llama3.1', key:process.env.STUDIO_MODEL_KEY } : { mode:'demo' });
fs.mkdirSync(out,{recursive:true}); const all = []; const done = path.join(qdir,'done'); fs.mkdirSync(done,{recursive:true});
for (const f of fs.readdirSync(qdir).filter(f=>f.endsWith('.json'))) {
  let job; try { job = JSON.parse(fs.readFileSync(path.join(qdir,f),'utf8')); } catch(e){ console.error('skip', f, e.message); continue; }
  const brand = job.brand || { id:'default', banned:['guaranteed'] };
  const r = await runPipeline({ brief:job.brief, brand, platforms:job.platforms||['x','instagram','linkedin'], langs:job.langs||['en'], roles, provider });
  applyAutonomy(r.drafts, job.brief, brand);
  const base = f.replace(/\.json$/,'');
  fs.writeFileSync(path.join(out, base+'.drafts.json'), JSON.stringify({ log:r.log, drafts:r.drafts }, null, 1));
  fs.writeFileSync(path.join(out, base+'.md'), `# ${job.brief.topic}\n\n` + r.drafts.map(d=>`## ${d.platform} ${d.lang} — ${d.status}${d.fixAttempts?` (${d.fixAttempts} auto-fixes)`:''}\n\n${d.text}\n\nIssues: ${d.issues.map(i=>i.msg).join('; ')||'none'}\n`).join('\n'));
  fs.renameSync(path.join(qdir,f), path.join(done,f)); all.push(...r.drafts);
}
const g = digest(all); fs.writeFileSync(path.join(out,'DIGEST.md'), `# Studio digest ${g.at}\nReady for Matt: ${g.ready}\nEscalated (failed 3 auto-fixes): ${g.escalated}\n${g.needsMatt}\nNothing was posted or sent.\n`);
console.log(JSON.stringify(g));
