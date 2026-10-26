import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome' }); const p = await b.newPage(); let fired=false;
p.on('dialog', d=>{fired=true; d.dismiss();}); await p.goto('http://localhost:5178/#studio');
const x = '<img src=x onerror=alert(1)>"\'><script>alert(2)</script>';
await p.fill('#topic',x); await p.fill('#audience',x); await p.fill('#points',x); await p.click('#briefForm button[type=submit]'); await p.waitForTimeout(800);
for (const t of ['approvals','deliverables','center']) { await p.click(`[data-tab=${t}]`); await p.waitForTimeout(200); }
await p.click('[data-tab=leads]'); await p.fill('#ln',x); await p.click('#leadForm button[type=submit]'); await p.waitForTimeout(200);
console.log('xss_fired', fired, 'img_tags', await p.locator('main img').count()); await b.close();
