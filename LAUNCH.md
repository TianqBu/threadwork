# Launch

The plan for the v0.1.0 public post. Internal notes; this file is not
shipped to npm.

## HN title — 3 variants

Pick one shortly before posting; the other two go to lobste.rs and r/ClaudeAI.

1. **Show HN: Threadwork – yaml roles + memory + step-level replay for Claude Code**
   *(spec-forward; signals all three deltas in one line)*
2. **Show HN: A debugger for Claude Code agents (and yaml-defined roles)**
   *(curiosity-forward; the "debugger" framing is the empirically rare angle)*
3. **Show HN: Threadwork – ruflo for people who do not want hardcoded roles**
   *(opinionated; lands well with people who already tried ruflo and bounced)*

Avoid: "powerful", "revolutionary", "next-generation", emoji-heavy titles.
HN downweights all of them, and they read as AI-slop.

## Hero blurb (for HN body, lobste.rs, Discord)

```
Hi HN — I built threadwork, a small CLI + MCP server that adds three
things to a Claude Code session:

- Role yamls you can hot-swap (one file = one role; sub-500 ms reload).
- Persistent memory as an MCP server (SQLite + FTS5, no embeddings).
- A step-level trace replay UI rendered as a single static HTML file.

The replay UI is the part I am most proud of — every agent step
produces a row, every memory call is auto-traced, and the timeline is
clickable. If your agent did something weird, the replay shows you
exactly which step it was.

It is MIT, npm-installable, and works on macOS/Linux/Windows. v0.1.0
is intentionally small: no embeddings, no consolidation, no web
dashboard. The whole MVP is ~3k lines.

Repo: https://github.com/REPLACE_OWNER/threadwork
Demo gif: README hero
Why-not-X table: README

Honest feedback welcome — especially install failures, since that is
the part most likely to be broken on a stranger's machine.
```

## Posting checklist (T-1 day)

- [ ] `pnpm publish --dry-run` clean from `packages/cli`
- [ ] `npm view threadwork-cli` returns the v0.1.0 entry (after real publish)
- [ ] `claude mcp list` on a clean Windows VM shows `threadwork`
- [ ] HN title chosen and timer set for 8:00 AM ET
- [ ] Discord invite link is permanent, not 24h
- [ ] awesome-claude-code PR is at least open
- [ ] README hero gif < 2 MB and loads on github.com mobile

## Posting time

8:00–9:30 AM ET on a Tuesday or Wednesday. Avoid Mondays (front-page
churn) and Fridays (weekend drop-off).

## Day-of monitoring

- Pin a comment with the install command and a link to install.md.
- Reply within the first hour to anyone reporting an install issue.
- Do not argue with "just another wrapper" comments — point at the
  Why-not-X table and move on.

## Failure mode

If the post is < 50 stars in 24h:

- Do not repost. HN penalises near-duplicate URLs.
- Send the blurb to 2-3 newsletters (TLDR, Bytes, Console).
- Ship a v0.1.1 with one tester-driven fix and post Show HN: again at
  the v0.1.1 milestone, with the fix as the hook.
