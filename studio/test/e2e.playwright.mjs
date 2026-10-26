import { chromium } from 'playwright'; import { AxeBuilder } from '@axe-core/playwright'; import fs from 'node:fs';
const out = '/workspace/rotato-100x/shots'; fs.mkdirSync(out,{recursive:true});
const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome' }); const res = { errors:[], axe:{}, checks:{} };
for (const [w,h,tag] of [[360,780,'m'],[1280,860,'d']]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, acceptDownloads:true }); const p = await ctx.newPage();
  p.on('pageerror', e=>res.errors.push(tag+': '+e.message)); p.on('console', m=>{ if(m.type()==='error') res.errors.push(tag+' console: '+m.text()); });
  await p.goto('http://localhost:5178/#studio');
  await p.fill('#topic','missed calls after hours'); await p.fill('#audience','Austin plumbers');
  await p.fill('#points','An AI receptionist answers the call.\nYou get a text summary.');
  await p.check('input[name=lg][value=fr]'); await p.click('#briefForm button[type=submit]');
  await p.waitForTimeout(2500); await p.screenshot({ path:`${out}/${tag}-studio-canvas.png`, fullPage:false });
  res.checks[tag+'_cards'] = await p.locator('.agent-card').count();
  res.checks[tag+'_done_cards'] = await p.locator('.agent-card.done').count();
  for (const tab of ['center','approvals','deliverables','roster','queue','analytics','replies','leads','brands','settings']) {
    await p.click(`[data-tab=${tab}]`); await p.waitForTimeout(300);
    if (tab==='approvals') { res.checks[tag+'_ready'] = await p.locator('button[data-act=approve]:not([disabled])').count();
      await p.locator('button[data-act=approve]:not([disabled])').first().click(); }
    if (tab==='roster') { res.checks[tag+'_roster'] = await p.locator('.tile.agent').count(); await p.fill('#rq','tiktok'); res.checks[tag+'_search'] = await p.locator('.tile.agent').count();
      await p.locator('.tile.agent input').first().check(); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#teamExport')]); res.checks[tag+'_teamfile'] = fs.readFileSync(await dl.path(),'utf8').split('\n').slice(3).join(' ').trim(); }
    if (tab==='queue') { const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#exportBtn')]); res.checks[tag+'_pkg_items'] = JSON.parse(fs.readFileSync(await dl.path(),'utf8')).items.length; }
    if (tab==='analytics') { await p.fill('#xjson', JSON.stringify({data:[{id:'1',text:'test',created_at:'2026-10-01T14:00:00Z',public_metrics:{like_count:2,impression_count:40}}]})); await p.click('#ingestBtn'); res.checks[tag+'_ana'] = await p.locator('.stat').first().innerText(); }
    if (tab==='replies') { await p.fill('#cmt','How much is it?'); await p.click('#suggestBtn'); res.checks[tag+'_reply'] = await p.locator('#repOut pre').count(); }
    const a = await new AxeBuilder({ page:p }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    res.axe[`${tag}-${tab}`] = a.violations.map(v=>`${v.impact}:${v.id}(${v.nodes.length}) `+v.nodes.map(n=>n.html.slice(0,100)+" | "+n.failureSummary.slice(0,160)).join(" ;; "));
    await p.screenshot({ path:`${out}/${tag}-${tab}.png` });
    const ov = await p.evaluate(()=>document.documentElement.scrollWidth > innerWidth); if (ov) res.errors.push(`${tag}-${tab}: horizontal overflow `+await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,3).map(e=>e.tagName+'.'+e.className).join(',')));
  }
  await p.click('#langBtn'); await p.click('[data-tab=center]'); res.checks[tag+'_fr'] = await p.locator('h1').innerText(); await p.screenshot({ path:`${out}/${tag}-center-fr.png` });
  await ctx.close();
}
// G23: unattended runner -> import into app via file picker (fresh browser profile)
{ const { execSync } = await import('node:child_process'); const st = '/tmp/agency-agents/studio';
  fs.copyFileSync(st+'/queue/example-brief.json.sample', st+'/queue/e2e.json'); execSync('node '+st+'/scripts/runner.mjs');
  const day = new Date().toISOString().slice(0,10); const f = `${st}/out/${day}/e2e.drafts.json`;
  const ctx = await b.newContext({ viewport:{width:360,height:780} }); const p = await ctx.newPage(); p.on('pageerror', e=>res.errors.push('import: '+e.message));
  await p.goto('http://localhost:5178/#center'); await p.setInputFiles('#runnerFiles', [f]); await p.waitForTimeout(400);
  res.checks.import_toast = await p.locator('#toast').innerText();
  await p.click('[data-tab=approvals]'); res.checks.import_ready = await p.locator('button[data-act=approve]:not([disabled])').count();
  await p.click('[data-tab=center]'); await p.setInputFiles('#runnerFiles', [f]); await p.waitForTimeout(300); res.checks.import_again_toast = await p.locator('#toast').innerText();
  const a = await new AxeBuilder({ page:p }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze(); res.axe['m-center-import'] = a.violations.map(v=>v.id);
  await p.screenshot({ path:`${out}/m-center-import.png` }); await ctx.close();
  execSync(`rm -rf ${st}/out ${st}/queue/done`); }
await b.close(); console.log(JSON.stringify(res,null,1)); fs.writeFileSync('/workspace/rotato-100x/e2e-result.json', JSON.stringify(res,null,1));
