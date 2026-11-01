# 文档索引

本项目所有 Markdown 文档的入口。

## 根目录

- [README.md](../README.md) — 项目说明：快速开始、技术栈、目录结构
- [AGENTS.md](../AGENTS.md) — 给 AI 编码 agent 的项目约定：命令、规则、边界

## 规范（harness）

- [harness/spec.md](./harness/spec.md) — 详细技术规范：架构、目录、i18n、环境变量、请求层、样式、代码风格、测试、Git、边界
- [harness/README.md](./harness/README.md) — harness 目录说明

## 技术方案（specs）

- [specs/restrict-cross-route-imports.md](./specs/restrict-cross-route-imports.md) — 禁止 `src/routes` 跨 route 引用（方案对比）
- [specs/restrict-kebab-case-filenames.md](./specs/restrict-kebab-case-filenames.md) — 强制 ts/tsx/js/jsx 源文件名使用 kebab-case
- [specs/ai-quality-gates.md](./specs/ai-quality-gates.md) — AI 门禁现状盘点、常见门禁清单与分层落地方案
- [specs/agent-hook-gates.md](./specs/agent-hook-gates.md) — Agent hooks 门禁：pre-tool / post-tool / 生命周期 / permission 方案
- [specs/README.md](./specs/README.md) — specs 目录说明（技术方案正文放这里）

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
