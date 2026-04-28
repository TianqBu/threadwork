# Security

**简体中文** | [English](#english)

## 范围

Threadwork 改写 `~/.claude.json`——这是工具触碰的最敏感的文件。`init`
流程的 backup → validate → atomic-rename 协议（详见
[docs/install.md](./docs/install.md)）是有意设计；**任何改这条路径的
PR 都需要专门的 security 评审**。

## 报告漏洞

如果你认为发现了一个安全问题：

1. **不要**直接提 public issue。
2. 用 GitHub 的 [Private vulnerability
   reporting](https://github.com/TianqBu/threadwork/security/advisories/new)
   私下提交。
3. 我们 7 天内回复。闭源 alpha 阶段不会公开 advisory；正式发布之后
   按惯例公开。

## 已知不修

- `node:sqlite` 是 Node 22.5+ 的 experimental 特性。我们 pin
  `engines.node >=22.5.0` 但不对实验性 API 的运行时行为做额外保证。
- 默认 role yamls 不做 prompt-injection 过滤——v0.1 假设你信任你
  执行的 yaml；这与你信任本地 shell 脚本是同一层信任模型。

---

## English

## Scope

Threadwork rewrites `~/.claude.json`, the single most sensitive file the
tool touches. The init flow's backup → validate → atomic-rename
contract (see [docs/install.md](./docs/install.md)) is deliberate;
**any PR that touches it requires a dedicated security review**.

## Reporting a vulnerability

If you believe you have found a security issue:

1. **Do not** open a public issue.
2. Use GitHub [Private vulnerability
   reporting](https://github.com/TianqBu/threadwork/security/advisories/new).
3. We respond within 7 days. During closed alpha we do not publish
   advisories; after the public launch we follow the standard timeline.

## Won't-fix

- `node:sqlite` is experimental in Node 22.5+. We pin
  `engines.node >=22.5.0` but make no additional guarantees about
  experimental API runtime behavior.
- Default role yamls do not filter prompt injection — v0.1 trusts the
  yamls you choose to load, the same way you trust local shell scripts
  you run.
