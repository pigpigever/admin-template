# AGENTS.md

本文件是给 AI 编码 agent 的项目约定。项目文档索引见 `docs/index.md`（完整文档在 `docs/`）。

@docs/harness/index.md
@docs/harness/overview.md
@docs/harness/directory-structure.md
@docs/harness/i18n.md
@docs/harness/environment-variables.md
@docs/harness/request-layer.md
@docs/harness/theming.md
@docs/harness/code-style.md
@docs/harness/testing.md
@docs/harness/git-and-commits.md
@docs/harness/boundaries.md
@docs/harness/docs-and-specs.md

## Commands

- 开发：`pnpm dev`（自动 `env:sync development`）
- 构建：`pnpm build`（自动 `env:sync production`）
- 预览：`pnpm serve`
- 检查：`pnpm lint` / `pnpm lint:fix` / `pnpm typecheck`
- 测试：`pnpm test` / `pnpm test:watch` / `pnpm test:layout`
- 门禁：`pnpm docs:check`（文档结构）/ `pnpm test:layout`（测试布局）/ `pnpm verify`（全量）
- 文案：`pnpm extract`（改文案后必须执行）
- 接口：`pnpm api:gen`（按 `dune.config.ts` 从 swagger 生成到 `src/apis/`）
- 环境变量：`pnpm env:sync <development|production>`

## Standing rules

- 界面文案一律用 Lingui 宏（`<Trans>` / `t` / `msg`），msgid 用英文原文；不写裸 key
- 环境变量只在 `helm/values*.yaml` 维护，经 `src/lib/env.ts` 的 zod 校验；不硬编码
- 颜色只用 `src/index.css` `@theme` 里的变量（如 `text-primary`、`var(--color-primary)`）
- 常量放 `src/constants/`（按领域拆分文件）；魔法数字抽常量，不写裸数字
- 通用工具优先用 `es-toolkit`（`debounce`/`throttle`/`groupBy`/`chunk`/`uniq`/`pick`/`omit`/`clamp` 等）；库里有现成方法就别自己实现，也不要引入 lodash/underscore
- JSX 回调超过 1 行抽成具名函数；JSX props 超过 2 个时每个 prop 单独一行
- 测试代码放根目录 `tests/`，不在 `src/` 里写测试
- 源文件（ts/tsx/js/jsx）文件名用 kebab-case（如 `query-client.ts`）；`unicorn/filename-case` 以 error 拦截
- Agent 门禁：策略在 `.agent/guard-policy.json`，脚本在 `.agent/hooks/`；opencode / Claude / Codex 的接线各在 `.opencode/`、`.claude/`、`.codex/`，改策略或接线前先问
- 写 / 改技术方案前先加载 `write-spec` skill（`docs/skills/write-spec/SKILL.md`）；按模块 / 域 / 能力放置，门禁只做结构兜底
- 自定义 oxlint 插件放 `plugins/`，按关注点拆分（报错信息用英文）
- 布局放 `src/layouts/`，不放 `src/components/`
- 路由用虚拟文件路由：在 `src/routes.ts` 声明，页面文件放 `src/routes/`；新增页面两处都要改
- 路由文件（`src/routes/`）之间不要互相 import；共用逻辑下沉到 `src/lib` / `src/components` / `src/constants`
- 接口统一走 `@dune2/tools/rq` 的 `RequestBuilder`，全局拦截器在 `src/lib/request.ts`
- 接口代码由 `pnpm api:gen` 生成到 `src/apis/`（生成产物，不手改）
- 加依赖 / 改 lint 规则 / 改构建部署配置前，先问

## Boundaries

- ✅ Always：完成任务前跑 `pnpm lint && pnpm typecheck && pnpm test`；沿用现有目录与命名
- ⚠️ Ask first：新增或升级依赖；改 `.oxlintrc.json`；改 `vite.config.ts` / `helm/` / CI；改 i18n catalog 结构；改 `.agent/` 门禁策略或 agent hooks
- 🚫 Never：提交密钥或 `.env*`；手改生成文件（`src/routeTree.gen.ts`、`src/apis/`、编译产物）；用 `--no-verify` 绕过钩子
