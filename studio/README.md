# Studio — one-person AI agency control center (working name)

Built on **[agency-agents](https://github.com/msitarzewski/agency-agents)** (repo msitarzewski/agency-agents, Copyright (c) 2025 AgentLand Contributors, MIT — see `/LICENSE`). This folder is Mathieu Bukasa's addition on branch `matt-build`; the original library above it is unchanged.

**What it does (v1):**
- **Control center:** at-a-glance counts (ready for you, escalated, approved, waiting > 24 h) + the **orchestrator canvas**: one card per agent with live task progress (e.g. 12/12).
- **Content studio:** one brief -> X, Instagram (caption + carousel slides), TikTok script, LinkedIn, Facebook, YouTube Shorts script, in EN and/or FR. Pipeline: brief -> strategy -> brand -> draft -> QA -> fact-check -> auto-fix (max 3) -> ready for you. Each stage is assigned a real agent from the repo (`docs/AGENT_MAP.md`).
- **Ready for you:** human approval with edit, re-check, schedule date/time. Approve -> **Queue & calendar** -> export a ready-to-post JSON package. **Nothing posts or sends — you publish.**
- **Deliverables gallery**, **Roster** (all agents by division, search, runbook teams, export `team.txt` for `scripts/install.sh --agents-file`), **X analytics** import (paste X API v2 JSON), **Reply assistant** (drafts + intent + escalation), **Leads** (CSV export for the CRM), **Brand profiles** (AAMC, El Shaddai Express, Matt's X/IG preloaded), EN/FR UI.
- **Model adapter:** Demo mode (offline templates, no key) by default; optional any OpenAI-compatible free/local endpoint (e.g. Ollama `http://localhost:11434/v1`).

**Unattended runner:** drop briefs as JSON in `studio/queue/` (see `queue/example-brief.json.sample`) and run `node studio/scripts/runner.mjs`; drafts + `DIGEST.md` land in `studio/out/<date>/`. Never posts or sends. Scheduling it (cron/routine) needs Matt's OK.

## Run it (Node 20+, no npm install)
```bash
node studio/scripts/build-agent-map.mjs   # regenerate app/agents.json from the repo's agents
node --test studio/test/                  # 12 unit tests
node studio/serve.mjs                     # open http://localhost:5178
```
Data lives in your browser's localStorage (Settings -> Erase to reset). `studio/vercel.json` is ready for a free static deploy later **(not deployed; needs Matt's OK)**.

## Plug in a model later
Settings -> Mode "OpenAI-compatible", Base URL, Model, optional key. Free/local example: install Ollama, `ollama pull llama3.1`, base `http://localhost:11434/v1`. Note: a browser-stored key is only acceptable for single-user local use; the SaaS version must move calls server-side (see `docs/PRODUCTIZATION.md`).

## Docs
`docs/PLAN.md` (goals, verbatim asks) · `docs/ARCHITECTURE.md` · `docs/AGENT_MAP.md` · `docs/AUTONOMY_MAP.md` (+ autonomy tiers) · `docs/PRODUCTIZATION.md` · `audit/AUDIT.md`, `docs/SCHEDULE.md` (runner cron, awaiting OK).

E2E (optional): `cd <dir> && npm i playwright @axe-core/playwright`, start `serve.mjs`, then `node studio/test/e2e.playwright.mjs` (paths inside write to /workspace/rotato-100x; edit for your machine).
