# 技术方案：禁止 src/routes 跨 route 引用

| 项 | 内容 |
| --- | --- |
| 状态 | Implemented |
| 作者 | Command Code |
| 日期 | 2026-10-31 |
| 版本 | v0.2 |
| 关联 | — |

## 变更记录

| 版本 | 日期 | 变更 | 作者 |
| --- | --- | --- | --- |
| v0.2 | 2026-10-31 | 已按方案 A 实现 `routes/no-cross-route-import`（`plugins/routes.mjs`） | Command Code |
| v0.1 | 2026-10-31 | 初稿：跨 route 依赖约束方案对比 | Command Code |

## 1. 背景与问题

`src/routes/*` 是路由入口文件（导出 `Route`）。如果 `routes/b.tsx` 直接 import `routes/a.tsx`（或 `src/lib`、`src/components` 反向 import 路由文件），会带来：

- 路由模块被提前执行，产生副作用 / 初始化顺序问题
- 循环依赖，code-split 失效
- 路由之间强耦合，无法独立演进

现状：当前 5 个路由文件之间没有互相引用，迁移成本为 0。

## 2. 目标与非目标

**目标**

- 禁止 `src/routes/**` 里的文件被**另一个 route 文件**导入（"跨 route 引用"）
- 违规时在 `pnpm lint` / pre-commit 阶段直接报错

**非目标**

- 不改 TanStack Router 生成的 `src/routeTree.gen.ts`（它**必须** import 所有 route，需豁免）
- 本期不强制拆分现有文件（目前无违规）

## 3. 方案概览

共 5 种办法，按"精确度 / 成本"排序。推荐 **方法 A：自定义 oxlint 插件**；若后续要做整体依赖治理，再叠加 dependency-cruiser。

## 4. 可选方法

### 方法 A：自定义 oxlint 插件规则（推荐）

在 `plugins/routes.mjs` 新增规则 `routes/no-cross-route-import`（沿用现有 jsPlugins 机制）：

- 监听 `ImportDeclaration`、`ExportNamedDeclaration`（带 source）、动态 `import()`、`require()`
- 解析说明符：`@/routes/...` → `src/routes/...`；`./`、`../` 按当前文件目录解析
- 命中条件：**导入方在 `src/routes/` 内** 且 **目标也在 `src/routes/` 内** 且 目标 ≠ 自身
- 豁免：`src/routeTree.gen.ts`（生成文件，见非目标）
- 报错信息用英文（与现有插件一致）

可选两种作用域：

- **窄**：只禁 route → route（贴合"跨 route 被应用"）
- **宽**：禁止任何非生成代码 import `src/routes/**`（路由文件即入口，不被外部引用）

优点：精确（按解析后的真实路径判断别名/相对路径）、无新依赖、复用 `.oxlintrc.json` 的 jsPlugins、随 `pnpm lint` 和 pre-commit 自动执行。
缺点：需要自己维护规则代码。

### 方法 B：oxlint 内置 `no-restricted-imports`（零代码）

oxlint 的 `no-restricted-imports` 支持 `patterns.group`。给 routes 加 override：

```json
{
  "overrides": [
    {
      "files": ["src/routes/**/*.{ts,tsx}"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              {
                "group": ["@/routes/*", "./*", "../routes/*"],
                "message": "Route files must not import each other."
              }
            ]
          }
        ]
      }
    }
  ]
}
```

优点：零代码、即时可用。
缺点：只做**说明符模式匹配**，不做路径解析（`./*` 可能误伤未来的 `./sub/*`；别名变体需逐个补 pattern）；对动态 `import()` / `require()` 覆盖有限。适合快速兜底。

### 方法 C：dependency-cruiser（声明式依赖边界）

新增 `dependency-cruiser` + `.dependency-cruiser.cjs`，用 forbidden 规则禁止 `src/routes` 内部互引，并作为单独门禁（如 `pnpm dep:check`，或在 `docs/.scripts` 里包装）。

优点：声明式、能同时管循环依赖 / 分层 / 孤儿模块 / 别名解析；规则可读性好。
缺点：新增依赖 + 配置；比 lint 慢；需要单独接进 pre-commit/CI。

### 方法 D：`eslint-plugin-boundaries`（通过 jsPlugins）

按目录定义 element type（route / lib / component），禁止 `route → route`。

优点：专为模块边界设计，ESLint 兼容、可走 oxlint jsPlugins。
缺点：多为 devDependency；jsPlugins 仍是 alpha；element type 配置较重。

### 方法 E：自定义门禁脚本 `docs/.scripts/check-routes.mjs`

扫描 `src/routes/**` 的 import 并校验边界，作为 `pnpm` 门禁运行。

优点：与 lint 解耦，可做更复杂的自定义规则。
缺点：需要自己做解析（AST 或正则），等价于重复实现方法 A；且多一套校验入口。

## 5. 对比

| 方法 | 精确度 | 成本 | 动态 import 覆盖 | 与现有门禁集成 | 结论 |
| --- | --- | --- | --- | --- | --- |
| A 自定义插件 | 高（路径解析） | 中（写一次规则） | ✅ | ✅ `pnpm lint` | **推荐** |
| B no-restricted-imports | 中（模式匹配） | 低 | 部分 | ✅ `pnpm lint` | 快速兜底 |
| C dependency-cruiser | 高 | 中高（依赖+配置） | ✅ | 需单独接 | 做整体依赖治理时再加 |
| D eslint-plugin-boundaries | 高 | 中高 | 部分 | ✅（alpha） | 边界规则多时可选 |
| E 自定义脚本 | 高 | 中 | ✅（自实现） | 需新增门禁 | 与 A 重复 |

## 6. 推荐

1. 先上 **方法 A（窄作用域）**：只禁 route → route，规则名 `routes/no-cross-route-import`，severity `error`。
2. 约定：多个 route 共用的逻辑要下沉到 `src/components` / `src/lib` / `src/constants`，不要留在 `src/routes`。
3. 如果之后需要治理更多依赖边界（循环、跨层），再引入 **方法 C**。

## 7. 影响面与迁移

- 现有 route 之间无互引 → 无需改动业务代码。
- 需豁免 `src/routeTree.gen.ts`（生成文件，天然 import 所有 route）。
- 若采用窄作用域，`src/routes` 以外的代码 import 路由文件不报（可后续升级为宽作用域）。

## 8. 测试与验收

- 反例：`src/routes/b.tsx` 中 `import { Route } from "./a"` 或 `@/routes/a` → 报错
- 反例：动态 `import("@/routes/a")` → 报错
- 正例：`src/routeTree.gen.ts` 导入 routes → 不报
- 正例：从 `src/lib`、`src/constants` 导入 → 不报
- 回归：`pnpm lint` 通过，pre-commit 生效

## 9. 风险与开放问题

- 别名解析：本仓库固定 `@/routes`，解析逻辑可控；未来若新增别名需同步。
- 是否放宽到"禁止外部 import `src/routes/**`"（宽作用域）需产品/团队确认。
- `no-restricted-imports`（方法 B）对 `import()`/`require()` 的支持以 oxlint 实际行为为准。

## 10. 验收标准

- [ ] 规则在 `pnpm lint` 中以 error 级别生效
- [ ] 跨 route 静态/动态引用均被拦截
- [ ] `routeTree.gen.ts` 与外部导入不误报
- [ ] 现有代码 `pnpm lint` 通过
