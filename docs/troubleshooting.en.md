**English** | [简体中文](./troubleshooting.md)

# Troubleshooting

The things that have actually broken during the alpha, and what to check.

## `claude mcp list` does not show `threadwork`

Three possible causes:

1. **`init` did not write the file.** Re-run `threadwork init --dry-run`
   and read the diff it would apply. If the diff is sensible, run without
   `--dry-run`.
2. **You have a non-default Claude Code profile.** `init` writes to
   `~/.claude.json` by default; pass `--claude-config <path>` if your
   profile is elsewhere.
3. **The merged JSON is malformed.** Check `~/.claude.json.bak.<timestamp>`
   for the version before the merge. Threadwork validates before writing,
   so this should not happen — file an issue if it does, and include the
   backup.

## Roles do not hot-reload on Windows

Windows file watchers are unreliable for editor-style "rename + replace"
saves. Threadwork uses `chokidar` with `usePolling: true` on `win32`, so
it should pick up edits within ~500 ms. If it does not:

- Confirm the file is in `~/.threadwork/roles/` or `./.threadwork/roles/`,
  not somewhere else on disk.
- Confirm the yaml validates: `threadwork roles list` should show it.
- Try saving with the editor's atomic-save off (some editors write to a
  temp file and then rename, which can confuse polling).

## `memory_recall_episodes` returns nothing

- Did the writer call `memory_write_episode` first? Check the replay.
- Is the FTS5 query empty? bm25 will not rank zero-token queries.
- Are you scoping by a `task_id` that has no episodes?

`threadwork replay <task_id> --json` dumps the raw episode/trace rows so
you can see exactly what the database has.

## `pnpm bench:run` cost projection looks wrong

The projector reads `bench/pricing.json`. Anthropic occasionally updates
the rate card; bump the snapshot and re-run. Median across 3 runs is the
gate, not a single run — the bench script jitters tokens to model real
variance.

## `threadwork replay --serve` does not open a browser

The `open` package picks the OS default. On WSL, the default may be a
Linux-side browser that cannot reach the file path. Workaround:

```bash
threadwork replay <task_id>    # writes the html
explorer.exe .threadwork/replay/<task_id>.html   # WSL → Windows-side open
```

## `threadwork init` says `~/.claude.json` could not be written

Check file permissions (Windows: confirm you are not running an elevated
shell that creates files only readable by Administrator).

If a stale `~/.claude.json.new` exists from an interrupted previous run,
delete it and re-run.

## Reporting an issue

Use the alpha feedback template at
`.github/ISSUE_TEMPLATE/alpha-feedback.md`. The template requires repro
steps and environment so we can act on the report — drive-by "doesn't
work" reports get closed.
