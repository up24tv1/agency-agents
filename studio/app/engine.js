// Studio orchestrator engine. Pure functions: runs in browser and Node (tests).
export const PLATFORMS = {
  x:              { label: 'X',              limit: 280,  tags: 2,  kind: 'post' },
  instagram:      { label: 'Instagram',      limit: 2200, tags: 8,  kind: 'caption+carousel' },
  tiktok:         { label: 'TikTok',         limit: 2200, tags: 4,  kind: 'video script' },
  linkedin:       { label: 'LinkedIn',       limit: 3000, tags: 3,  kind: 'post' },
  facebook:       { label: 'Facebook',       limit: 2000, tags: 2,  kind: 'post' },
  youtube_shorts: { label: 'YouTube Shorts', limit: 5000, tags: 3,  kind: '60s script' }
};
// General, widely published starting points — NOT measured data for Matt's accounts.
// The Analytics tab replaces these once real X metrics are imported.
export const TIMING_HINTS = {
  x: { en: 'Weekdays 8–10 AM local; test and replace with your own analytics.', fr: 'En semaine 8 h–10 h (heure locale) ; testez puis remplacez par vos données.' },
  instagram: { en: 'Weekdays late morning or early evening; test.', fr: 'En semaine fin de matinée ou début de soirée ; à tester.' },
  tiktok: { en: 'Evenings 6–9 PM local; test.', fr: 'Le soir 18 h–21 h ; à tester.' },
  linkedin: { en: 'Tue–Thu mornings; test.', fr: 'Mardi–jeudi le matin ; à tester.' },
  facebook: { en: 'Weekday midday; test.', fr: 'En semaine vers midi ; à tester.' },
  youtube_shorts: { en: 'Afternoons/evenings; test.', fr: 'Après-midi ou soir ; à tester.' }
};
const T = {
  en: { hook: (t)=>`Most ${t.audience} lose time on ${t.topic}. Here's the fix.`,
        cta: (b)=> b.cta || 'Reply "INFO" and I\'ll send details.',
        point: 'Key point', step: 'Step', scene: 'Scene', vo: 'Voice-over', onscreen: 'On-screen text', slide: 'Slide',
        disclose: 'Drafted with AI assistance, reviewed by a human.' },
  fr: { hook: (t)=>`Beaucoup de ${t.audience} perdent du temps avec ${t.topic}. Voici la solution.`,
        cta: (b)=> b.cta_fr || 'Répondez « INFO » et je vous envoie les détails.',
        point: 'Point clé', step: 'Étape', scene: 'Scène', vo: 'Voix off', onscreen: 'Texte à l\'écran', slide: 'Diapo',
        disclose: 'Rédigé avec l\'aide de l\'IA, relu par un humain.' }
};
const STOP = new Set('the a an and or of to for in on with your you is are our we my de la le les des et pour avec un une du en vos votre nos'.split(' '));
export function slugTag(w){ return '#' + w.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]/g,''); }
export function hashtags(brief, brand, n){
  const words = `${brief.topic} ${brief.audience} ${(brand.keywords||[]).join(' ')}`.toLowerCase().split(/[^\p{L}\p{N}]+/u)
    .filter(w=>w.length>3 && !STOP.has(w));
  const uniq = [...new Set([...(brand.hashtags||[]).map(h=>h.replace(/^#/,'').toLowerCase()), ...words])];
  return uniq.slice(0,n).map(slugTag).filter(t=>t.length>2);
}
export function splitPoints(text){
  return String(text||'').split(/\n|(?<=[.!?])\s+/).map(s=>s.trim().replace(/^[-*•\d.)\s]+/,'')).filter(s=>s.length>3).slice(0,5);
}
function trimTo(s, n){ if (s.length<=n) return s; const cut = s.slice(0,n-1); return cut.slice(0, cut.lastIndexOf(' ')>0?cut.lastIndexOf(' '):n-1) + '…'; }

// ---------- templates (demo provider) ----------
export function templateDraft(platform, brief, brand, lang){
  const t = T[lang]; const pts = splitPoints(brief.points).length ? splitPoints(brief.points) : [brief.topic];
  const hook = brief.hook?.trim() || t.hook(brief); const cta = t.cta(brand);
  const tags = hashtags(brief, brand, PLATFORMS[platform].tags).join(' ');
  const sig = brand.signature ? `\n— ${brand.signature}` : '';
  switch(platform){
    case 'x': { let body = `${hook}\n\n${pts.slice(0,2).map(p=>'• '+p).join('\n')}\n\n${cta}`;
      const budget = 280 - (tags.length+2); return trimTo(body, budget) + '\n\n' + tags; }
    case 'instagram': return `${hook}\n\n${pts.map((p,i)=>`${i+1}. ${p}`).join('\n')}\n\n${cta}${sig}\n\n` +
      pts.map((p,i)=>`[${t.slide} ${i+1}] ${p}`).join('\n') + `\n\n${tags}`;
    case 'tiktok': return `[${t.scene} 1 · 0–3s] ${t.onscreen}: "${hook}"\n` +
      pts.map((p,i)=>`[${t.scene} ${i+2} · ${3+i*8}–${11+i*8}s] ${t.vo}: ${p}`).join('\n') + `\n[CTA] ${cta}\n\n${tags}`;
    case 'linkedin': return `${hook}\n\n${pts.map(p=>'→ '+p).join('\n\n')}\n\n${cta}${sig}\n\n${tags}`;
    case 'facebook': return `${hook}\n\n${pts.map(p=>'✅ '+p).join('\n')}\n\n${cta}${sig}`;
    case 'youtube_shorts': return `TITLE: ${trimTo(hook,90)}\n\n[0–3s HOOK] ${hook}\n` +
      pts.map((p,i)=>`[${t.step} ${i+1}] ${t.vo}: ${p} | ${t.onscreen}: ${trimTo(p,40)}`).join('\n') +
      `\n[END] ${cta}\n\nDESCRIPTION: ${pts[0]} ${tags}`;
  }
}

// ---------- QA + fact-check ----------
const RISKY = [/guarantee[d]?/i, /garanti/i, /\b100\s?%/, /\bbest in\b/i, /\#1\b/, /\bno risk\b/i, /\bsans risque\b/i, /\bfree money\b/i];
export function qaCheck(platform, text, brand, lang){
  const issues = []; const spec = PLATFORMS[platform];
  if (text.length > spec.limit) issues.push({ level:'fail', code:'length', msg:`${text.length}/${spec.limit} chars` });
  for (const r of RISKY) if (r.test(text)) issues.push({ level:'fail', code:'claim', msg:`Risky claim: ${r}` });
  for (const w of (brand.banned||[])) if (w && text.toLowerCase().includes(w.toLowerCase())) issues.push({ level:'fail', code:'banned', msg:`Banned word: ${w}` });
  if (!/\?|reply|répondez|dm|link|lien|book|réserv|info/i.test(text)) issues.push({ level:'warn', code:'cta', msg:'No clear call to action' });
  if (lang==='fr' && /\b(the|and|your)\b/i.test(text)) issues.push({ level:'warn', code:'lang', msg:'English words in FR draft' });
  return issues;
}
export function factCheck(text, brief){
  // Every number, price, %, date or named stat in the draft must be traceable to the brief's "sources/facts" field.
  const facts = `${brief.facts||''} ${brief.points||''} ${brief.topic||''}`;
  const nums = [...new Set(text.match(/\$?\d[\d,.]*\s?%?/g)||[])].map(s=>s.trim()).filter(s=>!/^\d{1,2}$/.test(s));
  return nums.filter(n=>!facts.includes(n.replace(/\s/g,''))).map(n=>({ level:'fail', code:'unverified', msg:`Unverified number "${n}" — add a source or remove` }));
}

// ---------- orchestrator ----------
export async function runPipeline({ brief, brand, platforms, langs, roles, provider }){
  const log = []; const stamp = (stage, agent, note) => log.push({ stage, agent, note, at: new Date().toISOString() });
  const rn = roles?.roleNames || {};
  // 1 brief
  const missing = ['topic','audience'].filter(k=>!String(brief[k]||'').trim());
  if (missing.length) { stamp('brief','Studio','Missing: '+missing.join(', ')); return { ok:false, log, drafts:[] }; }
  stamp('brief','Studio',`Topic "${brief.topic}" for ${brief.audience}`);
  // 2 strategy
  stamp('strategy',(rn.strategy||[]).join(' + ')||'Strategist', `Goal: ${brief.goal||'engagement'}; voice: ${brand.voice||'n/a'}; platforms: ${platforms.join(', ')}`);
  stamp('brand',(rn.brand||[]).join(', ')||'Brand Guardian', `Banned words: ${(brand.banned||[]).join(', ')||'none'}`);
  const drafts = [];
  for (const p of platforms) for (const lang of langs) {
    // 3 draft
    let text, source='template';
    if (provider && provider.mode !== 'demo') {
      try { text = await provider.generate({ platform:p, lang, brief, brand, spec:PLATFORMS[p] }); source = provider.mode; }
      catch(e){ stamp('draft','model adapter',`Model failed (${e.message}); fell back to templates`); }
    }
    if (!text) text = templateDraft(p, brief, brand, lang);
    if (brand.disclose) text += `\n\n${T[lang].disclose}`;
    const agent = rn.draft?.[p] || 'Content Creator';
    stamp('draft', agent, `${PLATFORMS[p].label} ${lang.toUpperCase()} via ${source}`);
    // 4 QA, 5 fact-check
    const qa = qaCheck(p, text, brand, lang); stamp('qa',(rn.qa||[]).join(' + ')||'QA', `${p}/${lang}: ${qa.length} issue(s)`);
    const fc = factCheck(text, brief); stamp('factcheck',(rn.factcheck||[]).join(', ')||'Fact Checker', `${p}/${lang}: ${fc.length} unverified`);
    const blocked = [...qa,...fc].some(i=>i.level==='fail');
    drafts.push({ id: `${Date.now().toString(36)}-${p}-${lang}-${Math.random().toString(36).slice(2,6)}`, platform:p, lang, text, source,
      agent, issues:[...qa,...fc], status: blocked ? 'needs-fix' : 'pending-approval', hint: TIMING_HINTS[p][lang],
      brand: brand.id, created: new Date().toISOString() });
  }
  // 6 approve -> human
  stamp('approve','Matt (human)', `${drafts.filter(d=>d.status==='pending-approval').length} ready for approval, ${drafts.filter(d=>d.status==='needs-fix').length} need fixes. Nothing is published automatically.`);
  return { ok:true, log, drafts };
}

// ---------- analytics (X API v2 JSON) ----------
export function ingestX(json){
  const data = Array.isArray(json) ? json : (json?.data || []);
  const rows = data.filter(t=>t && t.public_metrics).map(t=>{ const m=t.public_metrics;
    const eng = (m.like_count||0)+(m.retweet_count||0)+(m.reply_count||0)+(m.quote_count||0)+(m.bookmark_count||0);
    return { id:t.id, text:String(t.text||'').slice(0,140), created_at:t.created_at||'', impressions:m.impression_count??null, engagements:eng,
      rate: m.impression_count ? eng/m.impression_count : null }; });
  const tot = rows.reduce((a,r)=>({ posts:a.posts+1, eng:a.eng+r.engagements, imp:a.imp+(r.impressions||0) }),{posts:0,eng:0,imp:0});
  const byHour = {}; for (const r of rows) if (r.created_at) { const h = new Date(r.created_at).getUTCHours(); (byHour[h] ||= []).push(r.engagements); }
  const bestHourUTC = Object.entries(byHour).map(([h,v])=>[+h, v.reduce((a,b)=>a+b,0)/v.length]).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null;
  return { totals: tot, top: [...rows].sort((a,b)=>b.engagements-a.engagements).slice(0,5), bestHourUTC, rows };
}

// ---------- reply assistant ----------
export function suggestReplies(comment, brand, lang){
  const c = String(comment||'').toLowerCase(); const t = lang==='fr';
  const intent = /price|cost|how much|combien|prix|tarif/.test(c) ? 'pricing'
    : /interested|info|dm|book|call|intéress|rendez|appel/.test(c) ? 'lead'
    : /scam|bad|terrible|arnaque|nul|angry/.test(c) ? 'complaint' : 'general';
  const R = {
    pricing: t ? ['Merci ! Je vous envoie les détails en message privé.','Bonne question — envoyez-moi un DM et je vous explique les options.']
               : ['Thanks! I\'ll DM you the details.','Great question — send me a DM and I\'ll walk you through the options.'],
    lead: t ? ['Avec plaisir ! Je vous écris en privé.','Super — quel est le meilleur moyen de vous joindre ?'] : ['Happy to help! Sending you a DM.','Awesome — what\'s the best way to reach you?'],
    complaint: t ? ['Désolé pour cette expérience. Pouvez-vous m\'écrire en privé pour qu\'on règle ça ?'] : ['Sorry about that experience. Can you DM me so we can make it right?'],
    general: t ? ['Merci beaucoup pour votre message !','Merci ! Qu\'est-ce qui vous a le plus parlé ?'] : ['Thank you so much!','Thanks! What resonated most with you?']
  };
  return { intent, escalate: intent==='complaint' || intent==='pricing', lead: intent==='lead'||intent==='pricing', replies: R[intent] };
}

// ---------- export / CRM ----------
export function exportPackage(items){
  return { generated: new Date().toISOString(), note: 'Ready-to-post package. Publish manually; nothing here posts automatically.',
    items: items.map(d=>({ platform: PLATFORMS[d.platform].label, lang:d.lang, scheduled_for: d.when||null, text:d.text, timing_hint:d.hint })) };
}
export function csvEscape(v){ const s = v==null?'':String(v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
export function leadsCSV(leads){
  const cols = ['created','name','handle','platform','source','note','status'];
  return [cols.join(','), ...leads.map(l=>cols.map(c=>csvEscape(l[c])).join(','))].join('\n');
}

// ---------- autonomy policy (see /docs/AUTONOMY.md) ----------
export const TIER_C = ['post-live','send','spend','settings','merge-main','deploy-public']; // always need Matt
export const POLICY = { maxRetries: 3, escalateAfterHours: 24 };
// Auto-fix loop: deterministic repairs for gate failures (Tier A). Max 3 attempts, then escalate.
export function autoFix(d, brief, brand){
  let attempts = 0;
  while (attempts < POLICY.maxRetries && d.issues.some(i=>i.level==='fail')) {
    attempts++;
    for (const i of d.issues.filter(i=>i.level==='fail')) {
      if (i.code==='length') d.text = d.text.slice(0, PLATFORMS[d.platform].limit-1).replace(/\s+\S*$/,'') + '…';
      if (i.code==='unverified') { const n = i.msg.match(/"(.+?)"/)?.[1]; if (n) d.text = d.text.split(n).join('').replace(/ {2,}/g,' '); }
      if (i.code==='claim' || i.code==='banned') { const w = i.code==='banned' ? i.msg.split(': ')[1] : null;
        d.text = w ? d.text.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'') : d.text.replace(/guarantee[d]?|garanti[e]?|\b100\s?%|best in|#1\b|no risk|sans risque|free money/gi,''); }
    }
    d.issues = [...qaCheck(d.platform, d.text, brand, d.lang), ...factCheck(d.text, brief)];
  }
  d.fixAttempts = attempts;
  d.status = d.issues.some(i=>i.level==='fail') ? 'escalated' : 'ready-for-matt';
  return d;
}
// Tier B: anything that passes all gates is auto-approved internally to "ready-for-matt" — nothing waits on him to keep the line moving.
export function applyAutonomy(drafts, brief, brand, now = new Date()){
  for (const d of drafts) {
    if (d.status==='needs-fix' || d.status==='pending-approval') autoFix(d, brief, brand);
    if (d.status==='ready-for-matt' && (now - new Date(d.created))/36e5 > POLICY.escalateAfterHours) d.stale = true;
  }
  return drafts;
}
export function digest(drafts, now = new Date()){
  const c = s => drafts.filter(d=>d.status===s).length;
  return { at: now.toISOString(), ready: c('ready-for-matt'), escalated: c('escalated'), approved: c('approved'), posted: c('posted'),
    waitingOver24h: drafts.filter(d=>d.status==='ready-for-matt' && (now-new Date(d.created))/36e5 > POLICY.escalateAfterHours).length,
    needsMatt: 'Only Tier C: posting live, sending, spend, settings, merge to main, public deploy.' };
}
// Per-agent task board for the orchestrator canvas (mirrors the "subagent canvas" in the spec video).
export function agentBoard(log){
  const b = {}; for (const l of log) for (const a of String(l.agent).split(/ \+ |, /)) { (b[a] ||= { agent:a, done:0, stages:new Set() }); b[a].done++; b[a].stages.add(l.stage); }
  return Object.values(b).map(x=>({ ...x, stages:[...x.stages] }));
}

// ---------- runner import (G23) ----------
// Accepts the parsed contents of studio/out/<date>/*.drafts.json written by scripts/runner.mjs.
// Validates shape, drops anything already present (by id), and never imports a status beyond ready-for-matt/escalated:
// approval, posting and sending stay with Matt.
export function importRunnerOutput(files, existing = []){
  const have = new Set(existing.map(d=>d.id)); const added = []; const rejected = [];
  for (const f of files) {
    const list = Array.isArray(f?.drafts) ? f.drafts : null; if (!list) { rejected.push('not a runner *.drafts.json file'); continue; }
    for (const d of list) {
      if (!d || typeof d.id!=='string' || !PLATFORMS[d.platform] || !['en','fr'].includes(d.lang) || typeof d.text!=='string') { rejected.push('invalid draft'); continue; }
      if (have.has(d.id)) { rejected.push('duplicate '+d.id); continue; }
      const status = d.status==='ready-for-matt' ? 'ready-for-matt' : 'escalated';
      added.push({ id:d.id, platform:d.platform, lang:d.lang, text:d.text.slice(0,PLATFORMS[d.platform].limit*2), source:'runner', agent:String(d.agent||'runner'),
        issues:Array.isArray(d.issues)?d.issues.filter(i=>i&&i.msg).map(i=>({level:i.level==='fail'?'fail':'warn',code:String(i.code||''),msg:String(i.msg)})):[],
        status, hint:String(d.hint||''), brand:d.brand, created:d.created||new Date().toISOString(), fixAttempts:d.fixAttempts||0 });
      have.add(d.id);
    }
  }
  return { added, rejected };
}
