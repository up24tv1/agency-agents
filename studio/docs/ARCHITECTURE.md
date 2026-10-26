# Architecture

**Stack (free, zero build step):** static HTML + vanilla ES modules (`studio/app/`), data in the browser's `localStorage`, Node 20+ only for the agent-map generator, tests and a tiny static server. No dependencies, no npm install. Deploys as a static site on Vercel/Netlify/GitHub Pages later (root directory `studio/app`) — not deployed now.

```
repo agents (*.md, MIT) --scripts/build-agent-map.mjs--> app/agents.json + docs/AGENT_MAP.md
                                                              |
app/index.html + app.js (UI, i18n EN/FR)  --->  app/engine.js (orchestrator, pure functions, unit-tested)
                                                   |  stages: brief > strategy > draft > QA > fact-check > approve
                                                   |  each stage tagged with the repo agent assigned to it
                                                   +--> app/model.js (provider adapter)
                                                           demo  : deterministic templates, offline, no key
                                                           openai-compatible : any free/local endpoint (e.g. Ollama http://localhost:11434/v1), key optional
```

**Human in the loop:** drafts land in the Approval queue. Approve -> Posting queue -> "Export package" (JSON + plain text per platform) that Matt posts manually. There is no publishing code at all, by design.

**Analytics:** paste/import JSON returned by the X API v2 `GET /2/users/:id/tweets?tweet.fields=public_metrics` (or the X connector's equivalent read). The app computes engagement totals and top posts locally. No scraping.

**Leads:** reply assistant and manual capture write to a local CRM table, exported as CSV for the AAMC shared ledger. No sending.

**Multi-tenant later:** swap localStorage for a Postgres free tier (e.g. Supabase) with per-workspace row-level security; model adapter moves server-side so keys never touch the browser. See PRODUCTIZATION.md.
