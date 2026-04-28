# Threadwork closed beta — invite + feedback flow

The W7 acceptance includes setting up the closed-beta channel before
public launch. This document is the operating procedure.

## Goals (in priority order)

1. **Catch install failures** before HN sees them. Especially on Windows.
2. **Confirm the W1/W7 dispatch path actually works** in someone else's
   real Claude Code session, not just in our spike.
3. **Find the first non-trivial use case** worth quoting in the launch
   thread.

## Tester profile

5–10 people from:

- The OMC (`oh-my-claudecode`) Discord #builders channel.
- The Claude Code official Discord, the `#extensions` channel.
- Personal contacts who already use Claude Code daily.

Avoid people who would only run `--help` and move on. Pick people whose
first instinct is to actually try the demo task.

## Invite template

```
Hey — I'm shipping a small npm package, threadwork-cli, that adds
yaml-defined roles + persistent memory + step-level replay to Claude Code.
It's at the alpha stage.

If you have ~30 minutes this week to try it on macOS / Linux / Windows
and tell me where it breaks, I'd really appreciate it. The README walks
you through install + a 60-second demo. I want one piece of honest
feedback: what part of the workflow felt clumsy?

Repo (private during alpha): <github URL>
Discord for live questions: <discord invite>
Issue template: .github/ISSUE_TEMPLATE/alpha-feedback.md
```

## Feedback collection

- One GitHub issue per tester, using `.github/ISSUE_TEMPLATE/alpha-feedback.md`
  as the template. The template requires environment + repro steps so we
  do not get drive-by "doesn't work" reports.
- A weekly digest of the top three pain points is added to
  `.omc/notepads/threadwork-mvp/alpha-feedback.md` (W7 -> W8 carryover).

## Exit criteria for closed beta

The beta closes and we move to public launch when **all three** are true:

- [ ] At least 3 testers have completed the full quickstart
      (`npm install -g threadwork-cli`, `threadwork init`, run a
      Claude-Code-side dispatch, see a replay HTML).
- [ ] No `Critical` issue is open (`Critical` = install fails on a
      supported platform, or replay produces no events for a successful
      run).
- [ ] At least one tester has produced a non-trivial use case worth
      quoting in the launch thread.

If any of those is unmet 7 days before the planned launch date, push the
launch by a week and keep iterating; do not ship to HN with broken
install paths.

## What we explicitly are **not** doing in the closed beta

- We are not collecting telemetry. Feedback is human, voluntary, and
  written.
- We are not paying testers or offering swag.
- We are not promising private features for early users.
