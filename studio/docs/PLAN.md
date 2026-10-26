# Studio (working name) — PLAN

Owner: Mathieu "Matt" Bukasa, Austin AI Marketing Co. Branch: `matt-build` (main = untouched backup of msitarzewski/agency-agents, MIT).

## Owner goals, verbatim (Oct 26, 2026)
> "Build me a 100x version of Rotato, the agency built by Sabrina Ramadanoff. And make sure you use this repo. First use this repo to do a backup of it, copy and paste to my repo, and then go ahead and improve it 100 times to work something to actually build a version of Rotato to monetize later. So first I'm gonna use it for myself, then later we monetize it."

Interpretation (to confirm with Matt): "Rotato" = **Blotato** (blotato.com), "Sabrina Ramadanoff" = **Sabrina Ramonov**. "100x" is an aspiration, not a measurable claim; the audit scores concrete goals instead.

## Audit checklist (each must score >= 98% or be recorded as a correction/blocker)
G1 Backup: fork main untouched, work on `matt-build`, MIT LICENSE + attribution kept.
G2 Agent map: repo agents scanned, pipeline roles mapped to real files (fails build if a file is missing).
G3 Orchestrator pipeline: brief -> strategy -> draft -> QA -> fact-check -> approve, each stage names its agent role.
G4 Brand profile + voice (multiple brands: AAMC, El Shaddai Express, Matt's X/IG).
G5 Idea -> multi-platform repurposing: X, Instagram, TikTok, LinkedIn, Facebook, YouTube Shorts script.
G6 EN/FR output and EN/FR UI.
G7 Hashtag + timing hints (labelled as general heuristics, not measured data).
G8 Approval queue, human-in-the-loop; nothing auto-publishes.
G9 Posting queue exporting ready-to-post packages (manual publish by Matt).
G10 Content calendar.
G11 Analytics ingest from X reads (import JSON from X API / X connector).
G12 Reply assistant (drafts only).
G13 Lead capture / CRM hook (CSV export, no sending).
G14 Provider-agnostic model adapter with no-key demo mode; works offline.
G15 Free stack, runs on the box, deployable free (static) later; no paid APIs, no signups.
G16 Mobile-first, accessible, production polish.
G17 Productization doc: positioning vs Blotato, pricing hypotheses, multi-tenant roadmap, risks.
G18 Tested by actually running it (automated tests + headless browser run).
G19 Build journal (PROCESS_LOG.md) and honest three-layer audit.

## Hard rules
No spend, no paid APIs, no signups, no posting/sending, no deploy, no merge to main without Matt's approval. Never invent facts or numbers.

## Mid-build changes (logged as they arrived)
**Oct 26, 8:46 AM CT — Matt, by voice (relayed by Chief of Staff):**
1. The TikTok (@ai.honeycove, https://www.tiktok.com/t/ZTfX5RyyD/) is the BUILD SPEC. Analysis (`/workspace/tiktok/video_analysis.md`): the video never mentions Blotato/Rotato/Sabrina; it shows agency-agents as a **one-person AI agency**: install roster into many tools, division-organized roster, an Agents Orchestrator coordinating many agents on one project, a "subagent canvas" of agent cards with per-agent task progress (4/11…11/11), output summaries and a deliverables montage.
2. Map every autonomy mechanism in the repo -> `docs/AUTONOMY_MAP.md`.
3. Three-layer audit at every stage, failures fixed and re-audited, recorded as corrections.
4. Must run in Matt's absence: autonomy tiers, auto-approve internal work, timeout/escalation, queue so nothing blocks on him. Still needs Matt: sending, buying, posting live, settings changes, spend, merging to main, public deploy.

**Resulting product definition:** a one-person-agency **control center** (roster browser by division, orchestrator canvas with live per-agent progress, deliverables gallery, team install export) **plus** the Blotato-style content engine (brand voice, idea -> 6 platforms, EN/FR, QA/fact-check, queue, calendar, analytics, replies, leads).

Added goals: G20 roster browser by division + runbook teams + install export; G21 orchestrator canvas with per-agent progress; G22 deliverables gallery; G23 autonomy tiers + auto-fix (max 3) + 24 h escalation + digest; G24 AUTONOMY_MAP.md.
