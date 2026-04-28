# ADR-0002 — Project name and npm package layout

**Status**: Accepted
**Date**: 2026-04-28
**Plan**: `.omc/plans/threadwork-mvp.md` &sect; W2

## Context

The plan's W2 day-1 stop condition requires verifying that the chosen project
name is available on npm and on GitHub before committing further packaging
work. This ADR records the result.

## Findings

### npm — bare name `threadwork`

```
$ npm view threadwork name version
name = 'threadwork'
version = '0.6.0'
```

The bare `threadwork` package is **taken** at v0.6.0 on the public registry.
Publishing under that name is not possible.

### npm — alternative package names (all free)

```
threadwork-cli            E404 (free)
threadwork-mcp-server     E404 (free)
threadwork-skill          E404 (free)
threadwork-replay-ui      E404 (free)
bastion-agent             E404 (free)
orchard-agents            E404 (free)
weave-agents              E404 (free)
loomwork                  E404 (free)
weavework                 E404 (free)
agent-threadwork          E404 (free)
```

### GitHub

`https://github.com/threadwork` returns HTTP 200, meaning the path
resolves &mdash; but resolving to a user/org page does not necessarily mean
the user/org is *active*. The user's repo will live under
`https://github.com/<their-username>/threadwork`, which is what matters for
the README badge URLs and PR backlinks. The path under the user's own
namespace is independent of the org-name collision and is verified at push
time.

## Decision

Adopt the **`threadwork-*` family** of npm packages instead of taking the
bare `threadwork` name:

| Package on disk           | npm name                  | Bin |
| :------------------------ | :------------------------ | :-- |
| `packages/cli`            | `threadwork-cli`          | `threadwork` |
| `packages/mcp-server`     | `threadwork-mcp-server`   | `threadwork-mcp-server` |
| `packages/skill`          | `threadwork-skill`        | _none_ |
| `packages/replay-ui`      | `threadwork-replay-ui`    | _none_ |

Branding is preserved (the binary the user actually types is still
`threadwork`; the GitHub repo is still `<user>/threadwork`). Only the npm
*publish identifier* is suffixed.

The `bastion-agent` / `orchard-agents` / `weave-agents` fallback chain from
the plan is **not** triggered, because we only had to swap the npm
identifier, not the brand.

## Alternatives considered

- **Bare `threadwork`.** Rejected: package exists, publish would fail.
- **`@threadwork/*` scoped packages.** Rejected: scope ownership requires
  registering a paid org or having a verified individual scope first; either
  way it adds a step that has nothing to do with the codebase. We can
  re-claim a scope and migrate later if that becomes worthwhile.
- **Switch the brand to `bastion`, `orchard`, or `weave`.** Rejected: the
  user's plan, README copy, and the v2 plan all refer to `Threadwork`.
  Changing the brand for an npm-name reason is a heavier cost than appending
  `-cli`.

## Consequences

- The bin name in `packages/cli/package.json` is unchanged: typing
  `threadwork ...` still works after `npm install -g threadwork-cli`.
- The W8 README install command is `npm install -g threadwork-cli` (not
  `npm install -g threadwork`).
- Future v0.2 may re-evaluate registering the `@threadwork` org if the
  project gains paid users; tracked as a follow-up in `LAUNCH.md`.

## Verification

`packages/*/package.json` carry the names listed in the table. CI's
`license-check` step in `.github/workflows/ci.yml` will exercise
`pnpm publish --dry-run` once W8 lands; that dry-run is the final verifier
for the names.
