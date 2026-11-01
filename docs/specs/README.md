# specs

技术方案（spec）目录：存放具体需求 / 功能的技术方案正文。

> 写 / 改方案前先加载 `write-spec` skill（`docs/skills/write-spec/SKILL.md`）：它负责模块 / 域 / 能力的放置决策与完整流程；门禁只做结构兜底。

状态图例（完整定义与流转见 skill）：

| 状态 | 含义 |
| --- | --- |
| `Draft` | 正在编写，未提交评审；新建默认 |
| `In Review` | 内容冻结，等待评审或决策 |
| `Approved` | 已批准，尚未完成实现 |
| `Implemented` | 已实现并验证，正文与代码一致 |
| `Superseded` | 已被新方案替代，仅保留历史 |
| `Rejected` | 未采纳或撤回，保留决策记录 |

状态只写在文档元数据表里，不按状态分目录；禁止 `WIP` / `Done` / `Approved*` / `Draft/In Review` 等模糊值。

元数据表在前，`## 变更记录` 在后；变更记录从 `v0.1` 开始，最新版本在第一行，版本号递增。

## 模块

- [quality/README.md](./quality/README.md) — 质量 / 测试 / CI 方案
- [quality/tdd-with-vitest.md](./quality/tdd-with-vitest.md) — 基于 Vitest 的 TDD 工作流（Draft）

## 平铺（待迁移）

- [restrict-cross-route-imports.md](./restrict-cross-route-imports.md) — 禁止 `src/routes` 跨 route 引用（方案对比）
- [restrict-kebab-case-filenames.md](./restrict-kebab-case-filenames.md) — 强制 ts/tsx/js/jsx 源文件名使用 kebab-case
- [ai-quality-gates.md](./ai-quality-gates.md) — AI 门禁现状盘点、常见门禁清单与分层落地方案
- [agent-hook-gates.md](./agent-hook-gates.md) — Agent hooks 门禁：pre-tool / post-tool / 生命周期 / permission 方案
- [organize-specs-by-module.md](./organize-specs-by-module.md) — docs/specs 按模块组织与索引门禁方案

模板见 [../.template/technical-design.md](../.template/technical-design.md)，项目规范见 [../harness/](../harness/)。

新增方案时，在本文件补一行链接，并同步更新 [../index.md](../index.md)。
