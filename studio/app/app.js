import { PLATFORMS, runPipeline, applyAutonomy, digest, agentBoard, ingestX, suggestReplies, exportPackage, leadsCSV, qaCheck, factCheck } from './engine.js';
import { makeProvider } from './model.js';
import { I18N } from './i18n.js';

const KEY='studio.v1';
const DEFAULT = { lang:'en', brandId:'aamc', settings:{mode:'demo',base:'http://localhost:11434/v1',model:'llama3.1',key:''}, drafts:[], leads:[], analytics:null, runs:[], team:[],
  brands:[
    { id:'aamc', name:'Austin AI Marketing Co.', voice:'Plain-spoken, local, practical; no hype', cta:'Reply "INFO" and I\'ll send details.', cta_fr:'Répondez « INFO » et je vous envoie les détails.', keywords:['Austin','small business','AI'], hashtags:['AustinSmallBusiness'], banned:['guaranteed'], signature:'Mathieu, Austin AI Marketing', disclose:false },
    { id:'elshaddai', name:'El Shaddai Express', voice:'Professional, warm, reliable', cta:'DM to book a ride.', cta_fr:'Écrivez-nous en DM pour réserver.', keywords:['Austin','chauffeur'], hashtags:['AustinTX'], banned:[], signature:'El Shaddai Express', disclose:false },
    { id:'matt', name:'Matt — X / Instagram', voice:'Direct, energetic, bilingual EN/FR', cta:'Follow for more.', cta_fr:'Abonnez-vous pour la suite.', keywords:[], hashtags:[], banned:[], signature:'', disclose:false } ] };
let S = load(); let roles = null; let tab = location.hash.slice(1); let rosterQ = '', rosterDiv = '';
function load(){ try { return { ...structuredClone(DEFAULT), ...JSON.parse(localStorage.getItem(KEY)||'{}') }; } catch { return structuredClone(DEFAULT); } }
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){ toast('Storage full: '+e.message); } }
const t = k => I18N[S.lang][k] ?? I18N.en[k] ?? k;
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (s, r=document) => r.querySelector(s);
const brand = () => S.brands.find(b=>b.id===S.brandId) || S.brands[0];
function toast(m){ const el=$('#toast'); el.textContent=m; el.classList.add('on'); clearTimeout(toast.h); toast.h=setTimeout(()=>el.classList.remove('on'),1800); }
function download(name, text, type='application/json'){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
const TABS=['center','studio','approvals','queue','deliverables','roster','analytics','replies','leads','brands','settings'];
if (!TABS.includes(tab)) tab='center';

function chrome(){
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  $('#langBtn').textContent = S.lang==='en' ? 'FR' : 'EN';
  $('#brandSel').innerHTML = S.brands.map(b=>`<option value="${esc(b.id)}" ${b.id===S.brandId?'selected':''}>${esc(b.name)}</option>`).join('');
  const pend = S.drafts.filter(d=>d.status==='ready-for-matt'||d.status==='escalated').length;
  $('#tabs').innerHTML = TABS.map(k=>`<button type="button" data-tab="${k}" ${k===tab?'aria-current="page"':''}>${t(k)}${k==='approvals'&&pend?`<span class="badge">${pend}</span>`:''}</button>`).join('');
}
function issueTags(d){ return d.issues.length ? d.issues.map(i=>`<span class="tag ${i.level}">${esc(i.msg)}</span>`).join('') : '<span class="tag pass">QA ✓ · fact-check ✓</span>'; }
function draftCard(d, actions, extra=''){ const ok = !['needs-fix','escalated'].includes(d.status);
  return `<article class="card draft ${ok?'ok':'bad'}" data-id="${esc(d.id)}">
   <div class="row"><strong>${esc(PLATFORMS[d.platform].label)}</strong><span class="tag">${d.lang.toUpperCase()}</span><span class="tag">${esc(t(d.status))}</span>${d.fixAttempts?`<span class="tag">${d.fixAttempts} ${t('fixes')}</span>`:''}${d.stale?`<span class="tag warn">${t('staleN')}</span>`:''}</div>
   <p class="meta">${esc(d.agent)} · ${esc(d.source)} · ${d.text.length}/${PLATFORMS[d.platform].limit}</p>
   ${actions ? `<label for="tx-${esc(d.id)}" class="sr">Text</label><textarea id="tx-${esc(d.id)}" rows="8">${esc(d.text)}</textarea>` : `<pre>${esc(d.text)}</pre>`}
   <div>${issueTags(d)}</div><p class="meta">${t('hint')}: ${esc(d.hint)}</p>${extra}${actions||''}</article>`; }
function canvasHTML(run, upto){ if(!run) return `<p class="empty">${t('noRun')}</p>`;
  const n = upto ?? run.log.length; const full = agentBoard(run.log); const now = agentBoard(run.log.slice(0,n));
  return `<div class="agents-grid">${full.map(b=>{ const d = now.find(x=>x.agent===b.agent)?.done || 0; const pct = Math.round(d/b.done*100);
    return `<div class="agent-card ${d===b.done?'done':''}"><div class="row" style="justify-content:space-between"><strong>${esc(b.agent)}</strong><span class="meta">${d}/${b.done}</span></div>
    <div class="bar" role="progressbar" aria-label="${esc(b.agent)}" aria-valuemin="0" aria-valuemax="${b.done}" aria-valuenow="${d}"><span style="width:${pct}%"></span></div>
    <p class="meta">${b.stages.map(esc).join(' → ')}</p></div>`; }).join('')}</div>
    <details><summary class="meta">${t('pipeline')} (${run.log.length})</summary><ol class="log">${run.log.map(l=>`<li><b>${esc(l.stage)}</b> · ${esc(l.agent)} — ${esc(l.note)}</li>`).join('')}</ol></details>`; }
const stat = (k,v,cls='') => `<div class="card"><div class="meta">${t(k)}</div><div class="stat ${cls}">${v}</div></div>`;
const VIEWS = {
  center(){ const g = digest(S.drafts); const run = S.runs[S.runs.length-1];
    return `<h1>${t('centerH')}</h1><p class="lead">${t('centerP')}</p>
    <div class="grid four">${stat('readyN',g.ready)}${stat('escN',g.escalated,g.escalated?'bad':'')}${stat('apprN',g.approved)}${stat('staleN',g.waitingOver24h,g.waitingOver24h?'warn':'')}</div>
    <section class="card"><h2>${t('canvas')}</h2><div id="canvas">${canvasHTML(run)}</div></section>`; },
  studio(){ const b = brand(); const B = S.lastBrief || {};
    return `<h1>${t('studioH')}</h1><p class="lead">${t('studioP')}</p>
    <form class="card" id="briefForm"><div class="grid two">
      <div><label for="topic">${t('topic')}</label><input id="topic" required value="${esc(B.topic)}"></div>
      <div><label for="audience">${t('audience')}</label><input id="audience" required value="${esc(B.audience)}"></div></div>
      <label for="goal">${t('goal')}</label><input id="goal" value="${esc(B.goal)}">
      <label for="hook">${t('hook')}</label><input id="hook" value="${esc(B.hook)}">
      <label for="points">${t('points')}</label><textarea id="points">${esc(B.points)}</textarea>
      <label for="facts">${t('facts')}</label><textarea id="facts" rows="2">${esc(B.facts)}</textarea>
      <fieldset><legend class="meta">${t('platforms')}</legend><div class="chips">
       ${Object.entries(PLATFORMS).map(([k,p])=>`<label class="chip"><input type="checkbox" name="pf" value="${k}" ${(B.platforms||Object.keys(PLATFORMS)).includes(k)?'checked':''}>${p.label}</label>`).join('')}</div></fieldset>
      <fieldset><legend class="meta">${t('languages')}</legend><div class="chips">
       ${['en','fr'].map(l=>`<label class="chip"><input type="checkbox" name="lg" value="${l}" ${(B.langs||['en']).includes(l)?'checked':''}>${l.toUpperCase()}</label>`).join('')}</div></fieldset>
      <button class="primary" type="submit">${t('run')} — ${esc(b.name)}</button></form>
    <section class="card" id="runOut" aria-live="polite"><h2>${t('canvas')}</h2><div id="canvas">${canvasHTML(S.runs[S.runs.length-1])}</div></section>`; },
  approvals(){ const list = S.drafts.filter(d=>['ready-for-matt','escalated','needs-fix'].includes(d.status));
    return `<h1>${t('approvals')}</h1>` + (list.length ? list.map(d=>draftCard(d, `<div class="row">
      <button type="button" class="small" data-act="recheck">${t('recheck')}</button>
      <label class="sr" for="when-${esc(d.id)}">${t('schedule')}</label><input type="datetime-local" id="when-${esc(d.id)}" style="width:auto">
      <button type="button" class="primary" data-act="approve" ${d.status!=='ready-for-matt'?'disabled':''}>${t('approve')}</button>
      <button type="button" class="small" data-act="reject">${t('reject')}</button></div>`)).join('') : `<p class="card empty">${t('noApprovals')}</p>`); },
  queue(){ const q = S.drafts.filter(d=>d.status==='approved'||d.status==='posted').sort((a,b)=>(a.when||'z').localeCompare(b.when||'z'));
    const now = new Date(); const y=now.getFullYear(), m=now.getMonth(); const first = new Date(y,m,1).getDay(); const days = new Date(y,m+1,0).getDate();
    let cal = ''; for (let i=0;i<first;i++) cal+='<div aria-hidden="true"></div>';
    for (let d=1; d<=days; d++){ const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const items = q.filter(x=>(x.when||'').startsWith(key)); cal += `<div><span class="d">${d}</span>${items.map(x=>`<div class="p" title="${esc(x.text.slice(0,80))}">${esc(PLATFORMS[x.platform].label)}</div>`).join('')}</div>`; }
    return `<h1>${t('queue')}</h1><div class="card"><h2>${esc(now.toLocaleString(S.lang,{month:'long',year:'numeric'}))}</h2><div class="cal">${cal}</div></div>
      <div class="row" style="margin-bottom:12px"><button type="button" class="primary" id="exportBtn" ${q.some(d=>d.status==='approved')?'':'disabled'}>${t('exportBtn')}</button></div>` +
      (q.length ? q.map(d=>draftCard(d,'',`<p class="meta">${t('schedule')}: ${esc(d.when||'—')}</p><div class="row"><button type="button" class="small" data-act="copy">${t('copy')}</button>${d.status==='approved'?`<button type="button" class="small" data-act="posted">${t('posted')}</button>`:''}</div>`)).join('') : `<p class="card empty">${t('noQueue')}</p>`); },
  deliverables(){ const items = [...S.drafts].reverse();
    return `<h1>${t('delivH')}</h1><p class="lead">${t('delivP')}</p>` + (items.length ? `<div class="gallery">${items.map(d=>`<article class="tile" data-id="${esc(d.id)}">
      <div class="row"><span class="tag">${esc(PLATFORMS[d.platform].label)}</span><span class="tag">${d.lang.toUpperCase()}</span><span class="tag">${esc(t(d.status))}</span></div>
      <p class="clip">${esc(d.text)}</p><p class="meta">${esc(d.agent)} · ${esc(new Date(d.created).toLocaleString(S.lang))}</p>
      <button type="button" class="small" data-act="dl">${t('download')} .txt</button></article>`).join('')}</div>` : `<p class="card empty">${t('noRun')}</p>`); },
  roster(){ if(!roles) return '<p class="card empty">Loading…</p>';
    const q = rosterQ.toLowerCase(); const list = roles.agents.filter(a=>(!rosterDiv||a.division===rosterDiv) && (!q || (a.name+' '+a.description+' '+a.slug).toLowerCase().includes(q)));
    const divs = Object.entries(roles.divisions);
    return `<h1>${t('rosterH')}</h1><p class="lead">${t('rosterP')} (${roles.count})</p>
    <div class="card"><div class="grid two"><div><label for="rq">${t('search')}</label><input id="rq" type="search" value="${esc(rosterQ)}"></div>
      <div><label for="rd">${t('division')}</label><select id="rd" style="width:100%"><option value="">${t('all')}</option>${divs.map(([k,v])=>`<option value="${k}" ${k===rosterDiv?'selected':''}>${esc(v.label)} (${roles.agents.filter(a=>a.division===k).length})</option>`).join('')}</select></div></div>
      <div class="row" style="margin-top:12px"><strong>${S.team.length} ${t('selected')}</strong><button type="button" class="primary" id="teamExport" ${S.team.length?'':'disabled'}>${t('exportTeam')}</button><button type="button" class="small" id="teamClear">${t('clear')}</button></div></div>
    <details class="card"><summary><strong>${t('runbooks')}</strong></summary>${roles.runbooks.map(r=>`<div class="rb"><strong>${esc(r.title)}</strong> <span class="tag">${esc(r.mode)}</span> <span class="meta">${esc(r.duration)} · ${r.agents.length} agents</span><p class="meta">${esc(r.summary)}</p><button type="button" class="small" data-runbook="${esc(r.slug)}">${t('useTeam')}</button></div>`).join('')}</details>
    <div class="gallery">${list.map(a=>{ const c = roles.divisions[a.division]?.color||'#888'; const on = S.team.includes(a.slug);
      return `<label class="tile agent ${on?'on':''}" style="--c:${esc(c)}"><span class="row"><input type="checkbox" data-slug="${esc(a.slug)}" ${on?'checked':''}><strong>${esc(a.emoji)} ${esc(a.name)}</strong></span>
      <span class="meta">${esc(roles.divisions[a.division]?.label||a.division)}</span><span class="clip">${esc(a.description)}</span></label>`; }).join('')}</div>`; },
  analytics(){ const a = S.analytics;
    return `<h1>${t('anaH')}</h1><p class="lead">${t('anaP')}</p><div class="card"><label for="xjson">JSON</label><textarea id="xjson" rows="6" placeholder='{"data":[{"id":"1","text":"…","created_at":"2026-10-01T14:00:00Z","public_metrics":{"like_count":3,"impression_count":120}}]}'></textarea>
      <div class="row" style="margin-top:8px"><button type="button" class="primary" id="ingestBtn">${t('ingest')}</button></div></div>` +
      (a ? `<div class="grid three">${stat('posts',a.totals.posts)}${stat('eng',a.totals.eng)}${stat('imp',a.totals.imp)}</div>
       <div class="card"><p class="meta">${t('best')}: ${a.bestHourUTC ?? '—'}</p><h2>${t('top')}</h2><div class="tablewrap"><table><thead><tr><th>Text</th><th>${t('eng')}</th><th>${t('imp')}</th></tr></thead><tbody>${a.top.map(r=>`<tr><td>${esc(r.text)}</td><td>${r.engagements}</td><td>${r.impressions??'—'}</td></tr>`).join('')}</tbody></table></div></div>` : ''); },
  replies(){ return `<h1>${t('repH')}</h1><p class="lead">${t('repP')}</p><div class="card"><label for="cmt">${t('comment')}</label><textarea id="cmt"></textarea>
      <label for="cmtFrom">${t('handle')}</label><input id="cmtFrom"><div class="row" style="margin-top:8px"><button type="button" class="primary" id="suggestBtn">${t('suggest')}</button></div></div><div id="repOut" aria-live="polite"></div>`; },
  leads(){ return `<h1>${t('leadsH')}</h1><form class="card grid two" id="leadForm">
      <div><label for="ln">${t('name')}</label><input id="ln" required></div><div><label for="lh">${t('handle')}</label><input id="lh"></div>
      <div><label for="lp">${t('platform')}</label><input id="lp"></div><div><label for="lno">${t('note')}</label><input id="lno"></div>
      <div class="row"><button class="primary" type="submit">${t('add')}</button><button class="ghost" type="button" id="csvBtn" ${S.leads.length?'':'disabled'}>${t('csv')}</button></div></form>
      <div class="card tablewrap"><table><thead><tr><th>${t('name')}</th><th>${t('handle')}</th><th>${t('platform')}</th><th>${t('note')}</th></tr></thead><tbody>${S.leads.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(l.handle)}</td><td>${esc(l.platform)}</td><td>${esc(l.note)}</td></tr>`).join('') || `<tr><td colspan="4" class="empty">—</td></tr>`}</tbody></table></div>`; },
  brands(){ const b = brand(); const f=(id,lab,val,ta)=>`<label for="${id}">${t(lab)}</label>${ta?`<textarea id="${id}" rows="2">${esc(val)}</textarea>`:`<input id="${id}" value="${esc(val)}">`}`;
    return `<h1>${t('brandsH')}</h1><form class="card" id="brandForm">${f('bn','name',b.name)}${f('bv','voice',b.voice,1)}<div class="grid two"><div>${f('bc','cta',b.cta)}</div><div>${f('bcf','ctaFr',b.cta_fr)}</div></div>
      <div class="grid two"><div>${f('bk','keywords',b.keywords.join(', '))}</div><div>${f('bt','tags',b.hashtags.join(', '))}</div></div>${f('bb','banned',b.banned.join(', '))}${f('bs','signature',b.signature)}
      <label class="chip" style="margin-top:12px;width:fit-content"><input type="checkbox" id="bd" ${b.disclose?'checked':''}>${t('disclose')}</label>
      <div class="row" style="margin-top:12px"><button class="primary" type="submit">${t('save')}</button><button class="ghost" type="button" id="newBrand">${t('newBrand')}</button></div></form>`; },
  settings(){ const s=S.settings; return `<h1>${t('setH')}</h1><p class="lead">${t('setP')}</p><form class="card" id="setForm">
      <label for="sm">${t('mode')}</label><select id="sm"><option value="demo" ${s.mode==='demo'?'selected':''}>Demo (offline templates)</option><option value="openai-compatible" ${s.mode!=='demo'?'selected':''}>OpenAI-compatible (local/free)</option></select>
      <label for="sb">${t('base')}</label><input id="sb" value="${esc(s.base)}"><label for="smo">${t('model')}</label><input id="smo" value="${esc(s.model)}">
      <label for="sk">${t('key')}</label><input id="sk" type="password" autocomplete="off" value="${esc(s.key)}">
      <div class="row" style="margin-top:12px"><button class="primary" type="submit">${t('test')}</button><button class="ghost" type="button" id="resetBtn">${t('reset')}</button></div></form>`; }
};
function render(){ chrome(); $('#view').innerHTML = VIEWS[tab](); }
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function replay(run){ const el = $('#canvas'); if(!el) return; if (reduce) { el.innerHTML = canvasHTML(run); return; }
  for (let i=0;i<=run.log.length;i++){ el.innerHTML = canvasHTML(run, i); await new Promise(r=>setTimeout(r, 60)); } }
function teamFile(){ const lines = S.team.map(s=>s);
  return `# Studio team export — ${new Date().toISOString()}\n# Agents from msitarzewski/agency-agents (MIT). Install into your tool with:\n#   ./scripts/install.sh --tool <claude-code|cursor|codex|gemini-cli|opencode|...> --agents-file team.txt\n${lines.join('\n')}\n`; }
document.addEventListener('click', async e=>{
  const tb = e.target.closest('[data-tab]'); if (tb){ tab = tb.dataset.tab; history.replaceState(null,'','#'+tab); render(); $('#main').focus(); return; }
  if (e.target.id==='langBtn'){ S.lang = S.lang==='en'?'fr':'en'; save(); render(); return; }
  const rb = e.target.closest('[data-runbook]'); if (rb){ const r = roles.runbooks.find(x=>x.slug===rb.dataset.runbook); S.team = [...new Set([...S.team, ...r.agents])]; save(); render(); return; }
  const act = e.target.dataset.act; if (act){ const card = e.target.closest('[data-id]'); const d = S.drafts.find(x=>x.id===card.dataset.id); if(!d) return;
    if (act==='dl'){ download(`${d.platform}-${d.lang}-${d.id}.txt`, d.text, 'text/plain'); return; }
    const ta = card.querySelector('textarea'); if (ta) d.text = ta.value;
    if (act==='recheck' || act==='approve'){ const brief = S.lastBrief||{}; d.issues = [...qaCheck(d.platform,d.text,brand(),d.lang), ...factCheck(d.text, brief)];
      d.status = d.issues.some(i=>i.level==='fail') ? 'escalated' : 'ready-for-matt'; }
    if (act==='approve' && d.status==='ready-for-matt'){ d.status='approved'; d.when = card.querySelector('input[type=datetime-local]')?.value || null; d.approvedAt = new Date().toISOString(); toast(t('toQueue')); }
    if (act==='reject') S.drafts = S.drafts.filter(x=>x!==d);
    if (act==='posted') d.status='posted';
    if (act==='copy'){ try { await navigator.clipboard.writeText(d.text); toast(t('copied')); } catch { toast('Clipboard blocked'); } }
    save(); render(); return; }
  if (e.target.id==='exportBtn') download(`studio-package-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(exportPackage(S.drafts.filter(d=>d.status==='approved')),null,2));
  if (e.target.id==='teamExport') download('team.txt', teamFile(), 'text/plain');
  if (e.target.id==='teamClear'){ S.team=[]; save(); render(); }
  if (e.target.id==='ingestBtn'){ try { S.analytics = ingestX(JSON.parse($('#xjson').value)); save(); render(); } catch(err){ toast('JSON: '+err.message); } }
  if (e.target.id==='suggestBtn'){ const r = suggestReplies($('#cmt').value, brand(), S.lang);
    $('#repOut').innerHTML = `<div class="card"><p class="meta">${t('intent')}: <b>${esc(r.intent)}</b>${r.escalate?` · <span class="tag warn">${t('escalate')}</span>`:''}</p>${r.replies.map(x=>`<pre>${esc(x)}</pre>`).join('')}${r.lead?`<button type="button" class="primary" id="leadFromReply">${t('addLead')}</button>`:''}</div>`; }
  if (e.target.id==='leadFromReply'){ S.leads.push({ created:new Date().toISOString(), name:$('#cmtFrom').value||'(unknown)', handle:$('#cmtFrom').value, platform:'', source:'reply-assistant', note:$('#cmt').value.slice(0,200), status:'new' }); save(); toast(t('saved')); }
  if (e.target.id==='csvBtn') download('studio-leads.csv', leadsCSV(S.leads), 'text/csv');
  if (e.target.id==='newBrand'){ const id='b'+Date.now().toString(36); S.brands.push({ id, name:t('newBrand'), voice:'', cta:'', cta_fr:'', keywords:[], hashtags:[], banned:[], signature:'', disclose:false }); S.brandId=id; save(); render(); }
  if (e.target.id==='resetBtn' && confirm(t('resetQ'))){ localStorage.removeItem(KEY); S = load(); render(); }
});
document.addEventListener('change', e=>{
  if (e.target.id==='brandSel'){ S.brandId = e.target.value; save(); render(); }
  if (e.target.id==='rd'){ rosterDiv = e.target.value; render(); }
  if (e.target.dataset.slug){ const s = e.target.dataset.slug; S.team = e.target.checked ? [...new Set([...S.team,s])] : S.team.filter(x=>x!==s); save(); render(); }
});
document.addEventListener('input', e=>{ if (e.target.id==='rq'){ rosterQ = e.target.value; const pos = e.target.selectionStart; render(); const el=$('#rq'); el.focus(); el.setSelectionRange(pos,pos); } });
document.addEventListener('submit', async e=>{ e.preventDefault(); const id = e.target.id;
  if (id==='briefForm'){ const brief = { topic:$('#topic').value, audience:$('#audience').value, goal:$('#goal').value, hook:$('#hook').value, points:$('#points').value, facts:$('#facts').value,
      platforms:[...document.querySelectorAll('input[name=pf]:checked')].map(i=>i.value), langs:[...document.querySelectorAll('input[name=lg]:checked')].map(i=>i.value) };
    if (!brief.langs.length) brief.langs=['en']; if (!brief.platforms.length) { toast(t('platforms')+' ?'); return; } S.lastBrief = brief;
    const run = await runPipeline({ brief, brand:brand(), platforms:brief.platforms, langs:brief.langs, roles, provider:makeProvider(S.settings) });
    applyAutonomy(run.drafts, brief, brand());
    run.log.push({ stage:'autonomy', agent:'Agents Orchestrator', note:`Auto-fix loop (max 3): ${run.drafts.filter(d=>d.status==='ready-for-matt').length} ready for Matt, ${run.drafts.filter(d=>d.status==='escalated').length} escalated. Nothing posted.`, at:new Date().toISOString() });
    S.drafts.push(...run.drafts); S.runs = [...S.runs.slice(-19), { at:new Date().toISOString(), log:run.log }]; save(); render(); $('#runOut').scrollIntoView({behavior: reduce?'auto':'smooth'}); replay(run); }
  if (id==='brandForm'){ const b = brand(); const L = v=>v.split(',').map(s=>s.trim()).filter(Boolean);
    Object.assign(b,{ name:$('#bn').value, voice:$('#bv').value, cta:$('#bc').value, cta_fr:$('#bcf').value, keywords:L($('#bk').value), hashtags:L($('#bt').value), banned:L($('#bb').value), signature:$('#bs').value, disclose:$('#bd').checked }); save(); render(); toast(t('saved')); }
  if (id==='leadForm'){ S.leads.push({ created:new Date().toISOString(), name:$('#ln').value, handle:$('#lh').value, platform:$('#lp').value, source:'manual', note:$('#lno').value, status:'new' }); save(); render(); }
  if (id==='setForm'){ S.settings = { mode:$('#sm').value, base:$('#sb').value, model:$('#smo').value, key:$('#sk').value }; save(); toast(t('saved')); }
});
fetch('agents.json').then(r=>r.json()).then(j=>{ roles=j; if(['roster'].includes(tab)) render(); }).catch(()=>toast('agents.json missing — run scripts/build-agent-map.mjs'));
render();
