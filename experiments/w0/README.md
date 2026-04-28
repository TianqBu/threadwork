# W0 spike

Run from this directory:

```bash
node loader.mjs spike-role.researcher.yaml "Find the latest spec version for MCP."
node loader.mjs spike-role.writer.yaml    "Find the latest spec version for MCP."
```

The two assembled prompts differ in:

- `## System prompt` block (different role contracts)
- `## Tools allowed` block (researcher has `WebSearch` / `WebFetch`; writer does not)
- `## Budget` block (different `max_tokens`, different `max_duration_sec`)

That divergence is what we wanted to see at W0.3. The live LLM dispatch test moves to W1.
