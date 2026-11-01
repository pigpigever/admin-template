| 日期 | 变更 | 作者 |
| --- | --- | --- |
| 2026-11-01 | 初稿：现状盘点 + 常见 AI 门禁清单 + 分层落地方案 | opencode |

# 技术方案：AI 门禁现状盘点与扩展方案

| 项 | 内容 |
| --- | --- |
| 状态 | Draft |
| 作者 | opencode |
| 日期 | 2026-11-01 |
| 关联 | — |

## 1. 背景与问题

项目已经把「约束 AI 编码 agent」写进 `AGENTS.md` / `docs/harness/index.md`，并落地了一批可执行门禁：oxlint（内置规则 + 自定义插件）、`tsc`、Vitest、`docs:check`、`test:layout`，以及 husky `pre-commit`。

**结论：已有 AI 门禁，但不完整。** 现状的问题不是「没有」，而是：

- 门禁分散在 `package.json`、`.husky/`、`docs/.scripts/`、`.oxlintrc.json`，没有统一的 `pnpm verify`
- 没有任何 CI（仓库无 `.github/`），本地钩子可被 `--no-verify` 绕过，缺少不可绕过的兜底
- 生成物、密钥、依赖 / 锁文件变更、i18n 完整性、API 层直连等关键边界仍靠约定
- 部分门禁（如 `pnpm test`）不在提交链路里

本方案先盘点现状，再给出常见 AI 门禁清单和分层落地顺序。

## 2. 目标与非目标

**目标**

- 盘点当前已生效的 AI 门禁及其触发点
- 给出可选的常见 AI 门禁清单（按类别、检测方式、优先级）
- 给出 P0 / P1 / P2 落地路线，明确每项改哪些文件、在哪个环节执行

**非目标（本次不做）**

- 本次只出方案，不改 CI、不加依赖、不改 `.oxlintrc.json`
- 不引入重型平台（SonarQube、Snyk 等）；如需引入单独评审
- 不追求 100% 覆盖率；门禁优先覆盖「AI 最容易犯且代价高」的错误

## 3. 现状盘点

### 3.1 已生效的硬门禁

| 门禁 | 位置 | 触发方式 | 拦截级别 |
| --- | --- | --- | --- |
| oxlint 内置规则（correctness / suspicious 等） | `.oxlintrc.json` | `pnpm lint`、lint-staged | error / warn |
| JSX 规则（长回调、props 换行） | `plugins/jsx.mjs` | 同上 | error |
| 设计令牌（禁止 hex 颜色） | `plugins/design-tokens.mjs` | 同上 | error |
| 常量目录（模块级常量必须在 `src/constants/`） | `plugins/architecture.mjs` | 同上 | error |
| 路由边界（`src/routes` 互不 import） | `plugins/routes.mjs` | 同上 | error |
| 文件名 kebab-case | `.oxlintrc.json`（`unicorn/filename-case`） | 同上 | error |
| Lingui / Vitest 专项规则 | `.oxlintrc.json` | 同上 | error / warn |
| TypeScript 类型检查 | `tsconfig.json` | `pnpm typecheck`、pre-commit | error |
| 单元 / 组件测试 | `tests/` + Vitest | `pnpm test` | error |
| 文档结构 | `docs/.scripts/check-docs.mjs` | `pnpm docs:check`、pre-commit | error |
| 测试布局 | `docs/.scripts/check-tests.mjs` | `pnpm test:layout`、pre-commit | error |
| 提交钩子 | `.husky/pre-commit` | `git commit` | 阻断提交 |

### 3.2 软约束（靠人和 AI 自觉）

- `AGENTS.md` 的 Standing rules
- `docs/harness/boundaries.md` 的 Always / Ask first / Never
- 生成物不手改、不提交密钥、不用 `--no-verify` 等约定

### 3.3 现有缺口

| 缺口 | 风险 |
| --- | --- |
| 无 CI | 本地钩子可绕过，无法作为合并前最后一道门 |
| 无统一 `pnpm verify` | 人和 AI 容易只跑一部分检查 |
| 不检查生成物 diff | `src/apis/**` 可能被手改；`routeTree.gen.ts` 已 gitignore，但仍有误改风险 |
| 无密钥扫描 | 仅靠 `.gitignore`，无法拦住硬编码 token |
| 依赖 / 锁文件变更无提醒 | AI 可能擅自加依赖、改 `pnpm-lock.yaml` |
| `lingui/no-unlocalized-strings` 关闭 | 新增裸文案不会被拦截 |
| 无 API 层直连检查 | 可能绕过 `RequestBuilder` 直接 `fetch` / `axios` |
| 无 diff 规模 / 禁止路径检查 | AI 可能大范围改配置或生成物 |

## 4. 常见 AI 门禁清单

按「AI 最容易犯、修起来最贵」排序。现状列：✅ 已有，◐ 部分，❌ 缺失。

### A. 代码质量

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| Lint / 类型 / 单测全绿 | oxlint + tsc + Vitest | ✅ | — |
| 禁止 `.only` / 跳过测试 | `vitest/no-focused-tests` 等 | ✅ | — |
| 变更文件必须有测试 / 覆盖率阈值 | Vitest coverage + 变更文件映射 | ❌ | P1 |
| 禁止调试残留（`console.log`、`debugger`） | oxlint（`no-console` 目前为 warn）+ 自定义规则 | ◐ | P1 |

### B. 架构与目录边界

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| 路由文件互不引用 | `plugins/routes.mjs` | ✅ | — |
| 常量必须放 `src/constants/` | `plugins/architecture.mjs` | ✅ | — |
| 文件名 kebab-case | `unicorn/filename-case` | ✅ | — |
| 分层依赖（routes / components / lib 单向） | 扩展 `plugins/architecture.mjs` | ◐ | P1 |
| 禁止深层相对路径，统一别名 | 自定义规则匹配 `../../` | ❌ | P1 |
| 布局只能放 `src/layouts/` | 自定义规则或脚本 | ❌ | P2 |

### C. 生成物与 AI 禁区

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| 禁止手改 `src/apis/**` | 提交前检查 staged diff 路径 | ❌ | **P0** |
| 禁止手改/提交生成文件 | 检查 `routeTree.gen.ts`、编译 catalog、`*.tsbuildinfo` | ◐（仅 gitignore） | **P0** |
| 禁止提交 `.env*` / 密钥 | 文件路径 + 内容正则扫描 | ◐（仅 gitignore） | **P0** |
| 禁止改 `helm/` / `vite.config.ts` / CI 等敏感配置 | 敏感路径 diff + approval 标记 | ❌ | P1 |

### D. 依赖与配置变更

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| `package.json` / `pnpm-lock.yaml` 变更需显式确认 | staged diff 检查 + 环境变量 / PR 标签白名单 | ❌ | **P0** |
| lockfile 与 manifest 同步 | `pnpm install --frozen-lockfile` | ❌ | P1 |
| 依赖安全审计 / license | `pnpm audit --prod` / license 脚本（CI） | ❌ | P2 |

### E. 安全

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| 密钥 / token 扫描 | 自定义正则脚本或 CI 用 gitleaks | ❌ | **P0** |
| 禁止危险 API（`eval`、`dangerouslySetInnerHTML`、`new Function`） | oxlint 自定义规则 | ❌ | P1 |
| 禁止直连网络（统一走请求层） | 自定义规则禁 `fetch` / `axios` 导入 | ❌ | P1 |
| 提交大文件 / 二进制 | staged 文件大小检查 | ❌ | P2 |

### F. 文案、设计与可访问性

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| 禁止硬编码颜色 | `plugins/design-tokens.mjs` | ✅ | — |
| 禁止裸文案（必须走 Lingui） | 自定义规则；内置规则当前关闭 | ❌ | P1 |
| 中英文 catalog 完整性 | 对比 `messages.po` 的 msgid / 译文 | ❌ | P1 |
| 可访问性 | `jsx-a11y`（已启用）+ 组件测试 axe | ◐ | P2 |

### G. 文档与知识同步

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| 文档索引 / README / AGENTS 引用完整 | `check-docs.mjs` | ✅ | — |
| 测试只能在 `tests/` | `check-tests.mjs` | ✅ | — |
| 大改动必须附带 spec | 检查 `docs/specs/` 是否有对应变更（启发式） | ❌ | P2 |
| 规范与实现漂移 | 定期人工 review；或脚本比对关键约定 | ❌ | P2 |

### H. Git 与提交

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| pre-commit 自动检查 | husky + lint-staged | ✅ | — |
| 禁止 `--no-verify` | 无法本地强制，需 CI 兜底 | ◐ | **P0**（CI） |
| 提交信息规范（Conventional Commits） | `commit-msg` 钩子 + 正则脚本 | ❌ | P1 |
| diff 规模上限（防止 AI 大范围改动） | staged diff 行数 / 文件数阈值 | ❌ | P2 |

### I. AI / Agent 行为层（可选）

| 门禁 | 检测方式 | 现状 | 优先级 |
| --- | --- | --- | --- |
| 命令白名单 / 敏感命令需确认 | opencode 等 agent 的 permission 配置 | ❌ | 按团队情况 |
| 禁区文件写入需确认 | agent 配置 deny / ask | ❌ | 按团队情况 |
| 生成代码必须人工 review | PR 流程 + CODEOWNERS | ❌ | P1 |

> 注：Agent 行为层属于工具配置（如 `.opencode/` 或用户级配置），不是仓库代码；改动前需要单独确认。

## 5. 推荐落地方案

原则：**本地快、CI 全、脚本零依赖优先**。oxlint 负责「单文件 AST」类规则，`docs/.scripts/*.mjs` 负责「仓库状态 / git diff」类检查，CI 负责不可绕过的兜底。

### 5.1 P0：先补齐不可绕过的底盘

1. **统一入口 `pnpm verify`**（`package.json`）
   - 串联：`lint` + `typecheck` + `test` + `docs:check` + `test:layout`
   - 可选：`pre-push` 执行，或由 CI 执行
2. **新增 CI**（`.github/workflows/verify.yml`，需确认）
   - `push` / `pull_request` 触发，执行 `pnpm install --frozen-lockfile && pnpm verify`
   - 这是唯一无法被 `--no-verify` 绕过的门禁
3. **生成物守卫** `docs/.scripts/check-generated.mjs`
   - 读取 staged / PR diff 路径
   - 命中 `src/apis/**`、`src/routeTree.gen.ts`、`src/i18n/locales/**/*.js`、`*.tsbuildinfo` 时失败，并提示正确生成命令
4. **密钥守卫** `docs/.scripts/check-secrets.mjs`
   - 扫描 staged 文本文件：`-----BEGIN.*PRIVATE KEY-----`、常见 token 前缀、`sk-` / `ghp_` / `AKIA` 等
   - 命中 `.env*` 直接失败
   - CI 可升级为 gitleaks（需新增工具）
5. **依赖变更守卫** `docs/.scripts/check-deps.mjs`
   - 若 staged 包含 `package.json` 或 `pnpm-lock.yaml`，默认失败并提示「加依赖需确认」
   - 允许通过显式环境变量（如 `ALLOW_DEP_CHANGES=1`）或 PR 标签放行
6. **提交绕过兜底**
   - 文档已禁止 `--no-verify`；真正兜底放在 CI

### 5.2 P1：补架构、文案、API 边界

7. **扩展 `plugins/architecture.mjs`**
   - `no-direct-fetch`：除 `src/lib/request.ts` 外禁止 `fetch` / `axios`
   - `no-deep-relative-import`：限制 `../../` 层级，优先 `@/` 别名
   - 分层依赖：`src/lib` 不得反向 import `src/routes` / `src/components`
8. **i18n 完整性**
   - `docs/.scripts/check-i18n.mjs`：对比 en / zh catalog 的 msgid 与空译文
   - 视情况开启或自定义替代 `lingui/no-unlocalized-strings`
9. **变更文件测试 / 覆盖率**
   - Vitest coverage 阈值（先在 CI 设低阈值，逐步提高）
   - 或脚本检查「改动的 `src/**` 是否伴随 `tests/**` 变更」
10. **提交信息规范**
    - `commit-msg` 钩子 + 简单正则（`feat|fix|chore|docs|refactor|test|build|ci`），不引入 commitlint
11. **调试残留**
    - 将 `no-console` 提升为 error（或只允许 `warn` / `error`），禁 `debugger`

### 5.3 P2：增强项

12. `check-bundle.mjs`：构建后检查产物大小预算
13. `pnpm audit --prod` / license 检查（CI）
14. 组件测试接入 axe，提升可访问性
15. 大文件 / 大 diff 检查
16. Agent 侧 permission / 禁区写入确认（需单独评审）

## 6. 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| A. oxlint 自定义插件 + `docs/.scripts` 零依赖脚本 | 贴合现状、无新依赖、可控 | 需要自己维护脚本 | ✅ 推荐 |
| B. 引入 commitlint / gitleaks / dependency-cruiser | 生态成熟、规则多 | 新依赖 + 新配置 + 维护成本 | 仅按需引入 |
| C. 全部依赖 CI | 不增加本地耗时 | 反馈慢，AI 要等 CI | ❌ 本地仍要快速门禁 |
| D. 只靠 AGENTS.md 约定 | 零成本 | AI 容易忽略，无法阻断 | ❌ |

执行位置建议：

- **pre-commit（快，< 10s）**：lint-staged、typecheck、`docs:check`、`test:layout`、生成物 / 密钥 / 依赖守卫
- **pre-push 或手动**：`pnpm verify`（含 `pnpm test`）
- **CI（全量、不可绕过）**：`pnpm install --frozen-lockfile` + `pnpm verify` + 安全 / 审计

## 7. 影响面、兼容性与迁移

- 只影响开发 / 提交链路，不影响运行时
- P0 会让「改依赖、改生成物、提交密钥」从「约定」变成「硬失败」，需要团队接受
- 迁移建议：先加 `pnpm verify` 和 CI，再加 P0 脚本，最后逐步加 P1 规则
- 回滚：删除对应脚本 / 规则或调整 `package.json` 即可，无数据迁移

## 8. 测试计划

- [ ] `pnpm verify` 在干净工作区通过
- [ ] 模拟新增 `src/apis/users/get.ts` 改动 → 生成物守卫失败
- [ ] 模拟提交 `.env.local` / 伪造 token → 密钥守卫失败
- [ ] 模拟修改 `package.json` 且未确认 → 依赖守卫失败
- [ ] 模拟新增 `fetch()` 调用 → `no-direct-fetch` 报错
- [ ] 模拟缺少 zh 译文 → i18n 门禁失败
- [ ] 用 `git commit --no-verify` 后，CI 仍能拦截
- [ ] 回归：`pnpm lint && pnpm typecheck && pnpm test && pnpm docs:check && pnpm test:layout` 通过

## 9. 风险与开放问题

| 风险 / 问题 | 影响 | 缓解措施 / 待定 |
| --- | --- | --- |
| 门禁过多导致提交变慢 | 降低开发体验 | pre-commit 只跑快检查，全量放 CI |
| 生成物 / 依赖守卫误伤正常流程 | 阻塞合法提交 | 提供显式放行开关；文档写清正确命令 |
| 密钥正则误报 | 频繁失败 | 允许行内豁免注释；CI 升级为 gitleaks |
| i18n 规则误报（message-as-id） | 噪音 | 先做 catalog 完整性检查，再评估裸文案规则 |
| 无 CI 平台 / 权限 | P0 无法完全落地 | 需确认使用的 Git 平台与 workflow 目录 |
| Agent 配置跨工具不一致 | 行为层门禁难统一 | 先落到仓库级脚本；agent 配置单独评审 |

## 10. 验收标准

- [ ] 明确现有门禁清单与触发点（本文第 3 节）
- [ ] 明确常见 AI 门禁目录与优先级（本文第 4 节）
- [ ] P0 完成：`pnpm verify` + CI + 生成物 / 密钥 / 依赖守卫
- [ ] P1 完成：架构边界、i18n、测试 / 覆盖率、提交信息
- [ ] 所有新增门禁都有通过 / 失败用例
- [ ] `AGENTS.md` / `docs/harness/index.md` 同步更新门禁清单
