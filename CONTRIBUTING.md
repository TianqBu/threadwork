# Contributing

**简体中文** | [English](#english)

Threadwork 当前在闭源 alpha 阶段。在公开 launch（约 2026-06-30）之前，
我们**只接收 issue，不接收人类 PR**。

> **例外：** Dependabot 自动开的 PR（依赖升级、Action 版本升级）
> 不算违反这条政策——它们走 CI 通过即可合，因为目标只是把
> deps 锁版保鲜，没有产品决策。

## 报 bug 或提建议

用 [`alpha-feedback` issue 模板](./.github/ISSUE_TEMPLATE/alpha-feedback.md)
提交。模板会要求环境信息和可复现步骤——这是让我们能真正去修，
而不是收到一堆 "装不上"。

## 等到正式发布之后

- 先翻 [.omc/plans/threadwork-mvp.md](./.omc/plans/threadwork-mvp.md)
  的 *Out of scope* 一节，确认你想提的不在拒收清单里。
- v0.2 才会开 PR review；提前的 PR 会被 close 并引导到 issue。
- v0.1 闭源 alpha 阶段的反馈流程见
  [docs/internal/alpha-beta.md](./docs/internal/alpha-beta.md)。

## 安全相关

`~/.claude.json` 改写流程是这个项目最敏感的代码路径，参见
[SECURITY.md](./SECURITY.md)。安全问题请走私下报告，不要开 public issue。

---

## English

Threadwork is in closed alpha. Before the public launch (~2026-06-30) we
**accept issues only, not human-authored PRs**.

> **Exception:** Dependabot-authored PRs (dependency / Action version
> bumps) are not covered by this policy — they merge on green CI.
> Their goal is keeping pinned deps fresh, not making product
> decisions.

## Reporting bugs / asking for features

Use the [`alpha-feedback` issue
template](./.github/ISSUE_TEMPLATE/alpha-feedback.md). The template asks
for environment + repro steps so we can act on the report.

## After the public launch

- Skim the *Out of scope* section of
  [.omc/plans/threadwork-mvp.md](./.omc/plans/threadwork-mvp.md) before
  proposing anything large.
- PR review opens with v0.2. Until then, early PRs will be closed with a
  pointer to the issue tracker.
- The closed-alpha feedback flow is documented in
  [docs/internal/alpha-beta.md](./docs/internal/alpha-beta.md).

## Security

The `~/.claude.json` rewrite path is the most sensitive code in this
repo — see [SECURITY.md](./SECURITY.md). Report vulnerabilities
privately, not via public issues.
