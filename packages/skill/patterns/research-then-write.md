# research-then-write

Sequential pipeline. The `researcher` role gathers cited facts; the
`writer` role turns those notes into prose.

## When to use

- The task is "produce an article / blog post / explainer about X".
- X needs investigation outside the model's training data.
- The output must be readable by an end user, not raw notes.

## Steps

1. **researcher** receives the original `<task>`. Output: cited facts +
   open questions.
2. **writer** receives the original `<task>` plus the researcher's notes.
   Output: the finished prose.

## Worked example

```
/threadwork research-then-write "What changed in the MCP spec between
2025-06 and 2025-11?"
```

Expected transcript shape:

```
[researcher.research]  "1. Tool definitions now ... (source: ...)"
[writer.compose]       "Between June and November 2025, the MCP spec ..."
```

## Stop conditions

- If researcher returns "Open questions" with critical missing facts and no
  citations, abort &mdash; do not let the writer paper over a gap.
- If writer cannot produce prose without inventing facts, abort and route
  back to researcher manually rather than degrade output.
