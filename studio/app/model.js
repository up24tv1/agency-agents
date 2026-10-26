// Provider-agnostic model adapter. Default 'demo' = offline templates, no key.
// 'openai-compatible' works with any free/local server exposing /v1/chat/completions
// (e.g. Ollama: base http://localhost:11434/v1, model "llama3.1"). Keys are optional and stay in this browser only.
export function makeProvider(cfg = {}){
  const mode = cfg.mode || 'demo';
  if (mode === 'demo') return { mode };
  return { mode, async generate({ platform, lang, brief, brand, spec }){
    const sys = `You are the ${platform} specialist of a content agency. Write in ${lang==='fr'?'French':'English'} in this brand voice: ${brand.voice||'clear, friendly'}. ` +
      `Max ${spec.limit} characters. Never invent numbers, prices, guarantees or testimonials; only use facts given. End with a call to action. Output only the post.`;
    const user = `Topic: ${brief.topic}\nAudience: ${brief.audience}\nGoal: ${brief.goal||''}\nKey points: ${brief.points||''}\nVerified facts: ${brief.facts||'none'}\nCTA: ${lang==='fr'?(brand.cta_fr||''):(brand.cta||'')}`;
    const r = await fetch(cfg.base.replace(/\/$/,'') + '/chat/completions', { method:'POST',
      headers: { 'Content-Type':'application/json', ...(cfg.key ? { Authorization:'Bearer '+cfg.key } : {}) },
      body: JSON.stringify({ model: cfg.model, temperature: 0.7, messages:[{role:'system',content:sys},{role:'user',content:user}] }) });
    if (!r.ok) throw new Error('HTTP '+r.status);
    const j = await r.json(); const out = j?.choices?.[0]?.message?.content?.trim();
    if (!out) throw new Error('empty response'); return out;
  } };
}
