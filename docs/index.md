# 文档索引

本项目所有 Markdown 文档的入口。

## 根目录

- [README.md](../README.md) — 项目说明：快速开始、技术栈、目录结构
- [AGENTS.md](../AGENTS.md) — 给 AI 编码 agent 的项目约定：命令、规则、边界

## 规范（harness）

- [harness/README.md](./harness/README.md) — harness 目录说明
- [harness/index.md](./harness/index.md) — 规范章节索引
- [harness/overview.md](./harness/overview.md) — 项目概览与技术栈
- [harness/directory-structure.md](./harness/directory-structure.md) — 目录结构
- [harness/i18n.md](./harness/i18n.md) — 国际化（Lingui）
- [harness/environment-variables.md](./harness/environment-variables.md) — 环境变量
- [harness/request-layer.md](./harness/request-layer.md) — 请求层与接口代码生成
- [harness/theming.md](./harness/theming.md) — 主题与样式
- [harness/code-style.md](./harness/code-style.md) — 代码风格与 Lint
- [harness/testing.md](./harness/testing.md) — 测试（Vitest）
- [harness/git-and-commits.md](./harness/git-and-commits.md) — Git 与提交
- [harness/boundaries.md](./harness/boundaries.md) — 边界（Always / Ask first / Never）
- [harness/docs-and-specs.md](./harness/docs-and-specs.md) — 文档与技术方案（spec）

## 技术方案（specs）

- [specs/restrict-cross-route-imports.md](./specs/restrict-cross-route-imports.md) — 禁止 `src/routes` 跨 route 引用（方案对比）
- [specs/restrict-kebab-case-filenames.md](./specs/restrict-kebab-case-filenames.md) — 强制 ts/tsx/js/jsx 源文件名使用 kebab-case
- [specs/ai-quality-gates.md](./specs/ai-quality-gates.md) — AI 门禁现状盘点、常见门禁清单与分层落地方案
- [specs/agent-hook-gates.md](./specs/agent-hook-gates.md) — Agent hooks 门禁：pre-tool / post-tool / 生命周期 / permission 方案
- [specs/organize-specs-by-module.md](./specs/organize-specs-by-module.md) — docs/specs 按模块组织与索引门禁方案
- [specs/README.md](./specs/README.md) — specs 目录说明（技术方案正文放这里）

## 技能（skills）

- [skills/README.md](./skills/README.md) — skills 目录说明
- [skills/write-spec/SKILL.md](./skills/write-spec/SKILL.md) — 写 / 改技术方案前加载（模块 / 域 / 能力放置）
- [skills/write-spec/README.md](./skills/write-spec/README.md) — write-spec skill 说明

## 模板（.template）

- [.template/technical-design.md](./.template/technical-design.md) — 技术方案模板
- [.template/bugfix.md](./.template/bugfix.md) — bugfix 模板
- [.template/README.md](./.template/README.md) — 模板目录说明
- [.template/index.md](./.template/index.md) — 模板索引

## 脚本（.scripts）

- [.scripts/README.md](./.scripts/README.md) — 门禁脚本目录说明
- [.scripts/index.md](./.scripts/index.md) — 门禁脚本索引

## 本目录

- [README.md](./README.md) — docs 目录说明
