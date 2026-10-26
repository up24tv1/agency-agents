# Three-layer audit — Studio v1 (Oct 26, 2026, America/Chicago)
L1 = worker self-critique (met? yes/no). L2 = cross-check with evidence + score. L3 = objectives/vulnerability review (adversarial).
**Honesty note:** L3 was run by the same build agent in an adversarial pass, not by a fresh independent session as premier-build requires. That is itself recorded as a correction (C9). Chief of Staff final audit is still pending.

## Evidence (real tools)
- Unit tests: `node --test studio/test/` -> 12 pass, 0 fail.
- Playwright e2e (Chrome, 360x780 and 1280x860): full flow brief -> 12 drafts -> approve -> queue export (1 item) -> roster 268 agents, search, team export -> analytics import -> replies -> FR switch. Result `audit/e2e-result.json`: 0 page errors, 0 overflow, axe WCAG 2.2 AA violations: 0 on all 20 page/viewport combos.
- XSS probe (`test/xss.playwright.mjs`): script/img payloads in brief, leads -> 0 dialogs, 0 injected img.
- Lighthouse 12 mobile (local, home): Perf 99 / A11y 100 / BP 100 / SEO 100; LCP 2.1 s, CLS 0.002, TBT 0 ms (`audit/lighthouse-summary.json`).
- Gzip JS+CSS+HTML ≈ 21.3 KB total; 0 npm dependencies in the app.
- Static server path traversal `/../LICENSE` -> 404.

## Goal scores
| Goal | L1 | L2 evidence | L2 | L3 objectives / vulnerability | Final |
|---|---|---|---|---|---|
| G1 backup on fork, main untouched, MIT kept | Yes | branch matt-build created from main b37b5bb; only `studio/` added; LICENSE untouched | 100 | No merge to main performed | 100 |
| G2 agent map | Yes | generator scans 18 divisions -> 268 agents; exits 1 if a mapped role file is missing | 100 | Runbook slugs checked (warning only) | 99 |
| G3 orchestrator pipeline | Yes | log stages brief/strategy/brand/draft/qa/factcheck/approve/autonomy, test #1 | 99 | "Agents" in demo mode are role labels + templates, not separate LLM agents; real multi-agent reasoning needs a model | 90 ⚠ |
| G4 brand profiles | Yes | 3 preloaded, editable, new brand | 99 | Brand facts kept minimal; nothing invented | 99 |
| G5 6-platform repurposing | Yes | 12 drafts per EN+FR run; X ≤280 test | 99 | Template output is serviceable, not "viral-grade" copy without a model | 92 ⚠ |
| G6 EN/FR | Yes | full UI dictionary both languages; FR headline verified in e2e | 98 | Demo mode does not translate the user's own key points; QA flags it (warning) | 93 ⚠ |
| G7 hashtags/timing | Yes | hashtags from brief/brand; timing hints labelled "test and replace" | 98 | Hints are generic, explicitly not Matt's data | 98 |
| G8 approval HITL | Yes | approve disabled unless gates pass; e2e approves 1 | 100 | — | 100 |
| G9 posting queue export | Yes | JSON package, "publish manually" note | 100 | No publishing code exists | 100 |
| G10 calendar | Yes | month grid of scheduled items | 98 | Month view only, no drag/drop | 96 ⚠ |
| G11 X analytics ingest | Yes | totals/top/best hour, test #8 | 99 | Manual paste only; no live X pull from the app (by design, free-only) | 95 ⚠ |
| G12 reply assistant | Yes | intent, escalation, EN/FR, test #9 | 98 | Keyword intent, not model-based | 94 ⚠ |
| G13 lead/CRM hook | Yes | CSV export, escaping test #10 | 99 | Not wired to the shared CRM sheet (needs Matt to share it) | 96 ⚠ |
| G14 model adapter + demo | Yes | `model.js`; demo default; fallback to templates on error | 98 | Not tested against a live Ollama on the box (none installed) | 94 ⚠ |
| G15 free stack, deployable | Yes | no deps, `vercel.json`, CSP headers | 100 | Not deployed (needs OK) | 100 |
| G16 mobile-first a11y polish | Yes | Lighthouse 99/100/100/100, axe 0, 360px no overflow | 99 | No Lighthouse on non-home tabs (SPA hash routes) | 98 |
| G17 productization doc | Yes | `docs/PRODUCTIZATION.md` | 98 | Prices labelled hypotheses; Blotato prices sourced | 98 |
| G18 tested by running | Yes | unit + e2e + Lighthouse + XSS | 100 | — | 100 |
| G19 journal + honest audit | Yes | PROCESS_LOG.md on box; this file | 97 | L3 not independent (C9) | 95 ⚠ |
| G20 roster + runbooks + install export | Yes | 268 agents, division filter, 4 runbook teams, team.txt for `install.sh --agents-file` | 99 | — | 99 |
| G21 orchestrator canvas | Yes | per-agent cards animate 0→N/N (e2e 15 cards, 15 done) | 98 | Progress is a replay of a completed run (pipeline runs in ms), not long-running live tasks | 95 ⚠ |
| G22 deliverables gallery | Yes | gallery + per-item download | 98 | Text deliverables only (no images/video) | 96 ⚠ |
| G23 autonomy tiers / escalation | Partly | Tier A auto-fix (max 3) + Tier B auto-ready + 24 h stale flag + digest, tests #6–7; unattended `scripts/runner.mjs` processes `queue/*.json` -> `out/<date>/` + DIGEST.md (ran on box: 8 ready, 0 escalated) | 95 | **Schedule not installed** (cron/routine needs Matt's OK as a settings change); runner output is files on disk, not yet merged into the browser app's queue | 90 ✗ |
| G24 AUTONOMY_MAP | Yes | 18 mechanisms with paths | 99 | — | 99 |
| Polish | Yes | screenshots on box `/workspace/rotato-100x/shots/` | 97 | Mobile header wraps to 2 rows (acceptable, not ideal) | 96 ⚠ |

**Below the 98% bar:** G3, G5, G6, G10–G14, G19, G21–G23, Polish. Most are capped by the free/no-model constraint (demo templates) and are not fixable without a model or Matt's decisions. **G23 is still below bar:** the unattended runner is built and tested (C10), but no schedule is installed and its output is not yet importable into the app.

## Corrections (material, fixed and re-audited)
- C1 Mobile 360px horizontal overflow on all tabs (header actions) -> header wraps, select max-width -> re-test 0.
- C2 Reply-assistant `<pre>` overflow on mobile -> global pre wrapping -> 0.
- C3 axe "color-contrast" on toast mid-fade -> removed opacity transition -> 0.
- C4 Lighthouse CLS 0.173, Perf 91 -> reserved header/tab heights + modulepreload -> CLS 0.002, Perf 98–99.
- C5 Roster filter mislabeled "Roster" -> "Division".
- C6 Shell interruption lost the first app.js write -> rewritten in parts; verified with `node --check`.
- C7 Spec changed mid-build (TikTok = spec; control center) -> plan re-scoped, G20–G24 added before coding resumed.
- C8 Author attribution first written as "Mike Sitarzewski" (unverified) -> replaced with the LICENSE holder "AgentLand Contributors".
- C9 L3 independence not met -> disclosed; needs Fact Checker / fresh session re-run.
- C10 G23 first scored 80 (no unattended path) -> built `scripts/runner.mjs` + queue sample, ran it on the box -> re-scored 90; still below bar.
