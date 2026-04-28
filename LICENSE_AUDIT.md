# License audit

This file is the human-readable companion to the `license-check` CI gate.
It records the policy and the snapshot of license SPDX identifiers seen in
the dependency tree at each release.

## Policy

Production dependencies are restricted to:

- `MIT`
- `Apache-2.0`
- `BSD-3-Clause`
- `BSD-2-Clause`
- `ISC`
- `CC0-1.0`
- `CC-BY-4.0`
- `Unlicense`
- `0BSD`

Strong copyleft (`AGPL-*`, `GPL-*`, `LGPL-*`) and source-available
(`BSL-*`, `SSPL-*`, `Elastic-2.0`) licenses are forbidden in `dependencies`.

Dev-only dependencies are not gated by the CI license-check command, but any
new devDependency that brings copyleft into the source tree must still be
reviewed and recorded here.

## How the check runs

`pnpm run license-check` invokes `license-checker --production --onlyAllow
"<allowlist>"`. The command exits non-zero if any production package has a
SPDX identifier outside the allowlist; that failure also fails CI.

## Snapshot

Snapshots are appended below at each tagged release. Format is:
`<package>@<version> <spdx>` one per line, sorted.

### v0.1.0 (pending)

_(populated automatically on `npm publish --dry-run` once dependencies land
in `packages/*` during W3-W7)_
