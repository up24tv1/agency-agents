# Productization (all prices are HYPOTHESES, not decisions)

## Positioning vs Blotato
Blotato (blotato.com/pricing, read Oct 26, 2026): Starter $29/mo, Creator $97/mo, Agency $499/mo; 7-day trial with card; AI writing, AI images/video (credit-metered), scheduling/publishing to many platforms, DM/comment automation, API + MCP on paid plans.
Studio's angle: **"a whole agency team, not a posting tool."** Differentiators that exist in v1: named specialist agents per stage (283 agents scanned from the MIT library), built-in QA + fact-check gates that block unverifiable numbers and risky claims, auto-fix loop, EN/FR, approval-first, works offline with no key. Gaps vs Blotato today: **no direct publishing, no image/video generation, no DM automation, no multi-user** — do not market parity.

## Pricing hypotheses (to test, not decided — Matt decides)
- Solo (1 brand): $19–29/mo · Pro (5 brands, BYO model key): $49–79/mo · Agency (white-label, client approval links): $149–299/mo.
- Done-for-you add-on through Austin AI Marketing (Matt reviews and posts): priced separately; must fit DECISIONS.md.
Validate with 5–10 Austin small businesses before building billing.

## Multi-tenant roadmap
1. Accounts + workspaces (Supabase/Postgres free tier, row-level security per workspace). 2. Server-side model proxy (keys never in browser), per-workspace usage caps. 3. Client approval links (read-only + approve/comment). 4. Official publishing APIs where the platform allows it and the user connects their own account (X API v2 write needs a paid tier today — verify before promising; Meta Graph for IG/FB requires app review; TikTok Content Posting API requires audit; LinkedIn requires partner approval). 5. Stripe billing (only after Matt approves prices). 6. Scheduled runner (cron) for autonomy tiers A/B.

## Risks
- **Platform ToS:** no scraping, no unofficial posting; only official APIs with the user's own auth. Automated DMs are restricted on most platforms.
- **AI disclosure:** optional disclosure line built in; some platforms/jurisdictions require labeling AI content, check per market.
- **Claims/compliance:** fact-check gate blocks unsourced numbers; FTC endorsement and CAN-SPAM rules still apply to what users publish.
- **MIT attribution:** keep `/LICENSE` and the credit line in the app footer/README in every distribution.
- **Naming/trademark:** "Rotato"/"Blotato" must not be used as the product name; pick an original name and search USPTO before launch.
- **Data:** v1 stores everything in the browser (lost if cleared); SaaS needs backups, privacy policy, and data deletion.
