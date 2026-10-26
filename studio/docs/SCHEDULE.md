# Runner schedule — AWAITING MATT'S OK (not installed)

Installing a schedule is a settings change, so it needs Matt's OK. Nothing below has been installed.

## Exact cron line (daily 06:00 America/Chicago, on the machine holding the repo)
```
CRON_TZ=America/Chicago
0 6 * * * cd /path/to/agency-agents && /usr/bin/env node studio/scripts/runner.mjs >> studio/out/runner.log 2>&1
```
Replace `/path/to/agency-agents` with the real clone path. Install with `crontab -e`, and only after Matt approves.

## Routine description
Every morning at 6:00 AM Central, the runner:
1. Reads each brief in `studio/queue/*.json`.
2. Runs the agent pipeline (Tier A auto-fix, at most 3 attempts).
3. Writes `studio/out/<date>/<brief>.drafts.json`, `<brief>.md` and `DIGEST.md`.
4. Moves the processed briefs to `queue/done/`.

It never posts, sends or spends anything. Matt opens Studio, goes to Control center, clicks **Import runner files**, and selects the day's `*.drafts.json`. The Tier B items then show up in **Ready for you** for approval. Items still unapproved after 24 h are flagged as stale.

To remove the schedule, delete the line with `crontab -e`.
