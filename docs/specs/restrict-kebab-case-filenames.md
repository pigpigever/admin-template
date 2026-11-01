| 日期 | 变更 | 作者 |
| --- | --- | --- |
| 2026-11-01 | 已按方案 A 实现：开启 `unicorn/filename-case`，重命名 `query-client.ts` | opencode |
| 2026-11-01 | 初稿：ts/tsx/js/jsx 文件名强制 kebab-case 方案 | opencode |

# 技术方案：强制源文件名使用 kebab-case

| 项 | 内容 |
| --- | --- |
| 状态 | Implemented |
| 作者 | opencode |
| 日期 | 2026-11-01 |
| 关联 | — |

## 1. 背景与问题

当前仓库的源文件基本已是 kebab-case（如 `admin-layout.tsx`、`query-client` 风格的目录命名），但 `.oxlintrc.json` 里显式关闭了 `unicorn/filename-case`：

```json
"unicorn/filename-case": "off"
```

因此没有任何门禁阻止新增 `queryClient.ts`、`UserList.tsx` 这类文件名。仓库现有唯一违规是 `src/lib/queryClient.ts`（被 `main.tsx`、`router.tsx`、`request.ts` 引用）。团队希望把「js 系源文件必须 kebab-case」固化为 lint 规则，而不是靠人工 review。

## 2. 目标与非目标

**目标**

- 新建或改名的 `.ts` / `.tsx` / `.js` / `.jsx` 文件不符合 kebab-case 时，`pnpm lint` 以 **error** 级别报错
- pre-commit（lint-staged）阶段同样拦截违规文件名
- 迁移现有违规文件，保持 `pnpm lint && pnpm typecheck && pnpm test` 全绿

**非目标**

- 不约束目录名、变量名、导出名（`queryClient` 等符号名保持 camelCase）
- 不重命名生成产物（`src/routeTree.gen.ts`、`src/apis/**`）
- 不引入新的 lint 依赖，不改构建 / 部署配置
- 不强制把 `*.config.ts`、`scripts/**/*.mjs` 纳入（当前已在 `ignorePatterns` 或本身合规）

## 3. 方案概览

使用 oxlint 内置的 `unicorn/filename-case`，开启 `kebabCase` 并保留少量豁免；同时用 `git mv` 完成现有文件重命名与 import 修正。

```
新增/改名文件
      │
      ▼
pnpm lint / oxlint（pre-commit）
      │
      ├─ 文件名非 kebab-case ──► error，提交被拦截
      └─ 合规 ──► 通过
```

## 4. 详细设计

### 4.1 涉及模块

- `.oxlintrc.json` — 开启文件名规则
- `src/lib/queryClient.ts` → `src/lib/query-client.ts` — 唯一存量违规
- `src/main.tsx` / `src/lib/router.tsx` / `src/lib/request.ts` — 更新 import 路径
- `AGENTS.md` / `docs/harness/code-style.md` — 补充命名约定
- `package.json` 的 `lint-staged` — 建议补上 `jsx`（可选）

### 4.2 规则配置

将 `.oxlintrc.json` 中的关闭项改为：

```json
"unicorn/filename-case": [
  "error",
  {
    "case": "kebabCase"
  }
]
```

已在本仓库 oxlint `1.90.0` 上实测：

- `fooBar.ts` → 报错并提示 `Rename the file to 'foo-bar.ts'`
- `index.tsx`、`__root.tsx` → **不报错**（`index` 与下划线前缀是规则内置豁免）
- `routeTree.gen.ts` → 会被规则命中，但已在 `ignorePatterns` 中忽略；如需双保险可加 `"ignore": ["routeTree\\.gen"]`
- 规则支持 `ignore` 正则数组，可对特殊文件名做豁免

#### 关于动态路由

本仓库使用 Virtual File Routes（`src/routes.ts` 显式声明路径），**文件名与 URL 解耦**。因此动态参数不需要写进文件名：

```ts
// src/routes.ts
route("/users/$userId", "user-detail.tsx")
```

约定路由文件继续用 kebab-case，`$userId` 这类 camelCase 参数只出现在路由路径字符串里。若未来确实需要 `$userId.tsx` 形式，可在规则中加豁免：

```json
"ignore": ["^\\$"]
```

### 4.3 存量迁移

| 原路径 | 新路径 |
| --- | --- |
| `src/lib/queryClient.ts` | `src/lib/query-client.ts` |

同步修改以下 import：

- `src/main.tsx:12` — `@/lib/queryClient` → `@/lib/query-client`
- `src/lib/router.tsx:3` — `./queryClient` → `./query-client`
- `src/lib/request.ts:3` — `@/lib/queryClient` → `@/lib/query-client`

导出符号 `queryClient` 不变，仅改文件名与 import 路径。

### 4.4 与现有约定的关系

- 文案：无新增 / 修改，无需 `pnpm extract`
- 环境变量：无
- 请求：无
- 主题：无
- 常量 / 路由：不新增常量；路由文件命名统一 kebab-case
- 测试：测试文件本身也受规则约束（`request.test.ts` 等已合规），测试仍放根目录 `tests/`
- 文档：在本方案落地后，同步更新 `AGENTS.md` 的 Standing rules 与 `docs/harness/code-style.md` 的命名说明

## 5. 备选方案与取舍

| 方案 | 优点 | 缺点 | 是否采用 |
| --- | --- | --- | --- |
| A. 内置 `unicorn/filename-case` | 零代码、零依赖；支持 `kebabCase` 与 `ignore`；随 `pnpm lint`、pre-commit 自动生效；报错信息自带建议名 | 作用于所有被 lint 的文件（`.mjs`/`.cjs`/`.d.ts` 也会管），范围略大于「仅 ts/tsx/js/jsx」 | ✅ |
| B. 自定义 oxlint 插件 `plugins/filenames.mjs` | 可精确限定扩展名与项目特有豁免；沿用现有 jsPlugins 机制 | 重复实现内置能力，需要自己维护规则与测试 | ❌（除非必须只限四种扩展名） |
| C. 独立门禁脚本 `docs/.scripts/check-filenames.mjs` | 可扫描未参与 lint 的文件；与 lint 解耦 | 多一套门禁入口，需自己遍历目录与忽略规则，等价重复实现 | ❌ |
| D. ESLint / dependency-cruiser | 生态成熟 | 新依赖 + 新配置，与现有 oxlint 体系割裂 | ❌ |

**结论**：选 A。内置规则的能力已覆盖需求，且仓库已有 `unicorn` 插件；方案 B 仅作为「必须严格只限四种扩展名」时的备选。

## 6. 影响面、兼容性与迁移

- 影响范围：仅 lint 门禁与 1 个文件重命名，不影响运行时行为
- 是否破坏兼容：否；export 名称不变
- 数据迁移：无
- 回滚方案：把规则改回 `"off"` 并 `git mv` 还原即可，无状态残留
- 注意：规则会顺带约束 `.mjs` / `.cjs` / `.d.ts`。当前仓库这些文件均已合规；若团队只想管四类扩展名，改用方案 B

## 7. 测试计划

- [ ] 反例：临时新建 `src/lib/fooBar.ts`，执行 `pnpm lint` 应报 `unicorn(filename-case)`
- [ ] 正例：`src/lib/foo-bar.ts` 不报
- [ ] 正例：`src/routes/__root.tsx`、`src/routes/index.tsx` 不报
- [ ] 正例：`src/routeTree.gen.ts`、`src/apis/**` 不参与校验
- [ ] 重命名后 `pnpm lint && pnpm typecheck && pnpm test` 通过
- [ ] 模拟 pre-commit：提交一个 camelCase 新文件应被 `lint-staged` 拦截
- [ ] `pnpm docs:check` / `pnpm test:layout` 通过

## 8. 上线与回滚

- 随常规代码提交合入，无灰度、无开关
- 建议顺序：先重命名 + 改 import，再开规则，最后补文档，保证每一步 `pnpm lint` 可过
- 回滚：规则改回 `off`，并用 `git mv` 还原文件名与 import

## 9. 风险与开放问题

| 风险 / 问题 | 影响 | 缓解措施 / 待定 |
| --- | --- | --- |
| 规则覆盖范围大于 ts/tsx/js/jsx | `.mjs` / `.cjs` / `.d.ts` 也会被要求 kebab-case | 现状均合规；如需严格限定扩展名，改用方案 B |
| 动态路由文件名 | `$userId.tsx` 会被判违规 | Virtual File Routes 下文件名与路径解耦，统一用 kebab-case；必要时加 `ignore` |
| macOS 大小写不敏感 | 仅大小写变化的重命名可能不被 git 识别 | 统一用 `git mv`；本方案不涉及纯大小写改名 |
| IDE 未装 oxlint 插件 | 编辑器内无即时提示 | 以 CLI / pre-commit 为准，文档中说明 |

## 10. 验收标准

- [ ] `unicorn/filename-case` 以 `error` + `kebabCase` 生效
- [ ] 现有代码无违规，`src/lib/queryClient.ts` 已重命名且引用全部更新
- [ ] `pnpm lint && pnpm typecheck && pnpm test` 通过
- [ ] 新增 camelCase / PascalCase 源文件会被 lint 与 pre-commit 拦截
- [ ] `AGENTS.md` 与 `docs/harness/code-style.md` 已记录命名约定
