# Admin Template — 详细规范

> 本文件由根目录 `AGENTS.md` 通过 `@docs/harness/spec.md` 引入，是项目的详细技术规范。

## 1. 项目概览与技术栈

单页管理后台模板（SPA，非 SSR），基于 Vite。

| 领域 | 选型 |
| --- | --- |
| UI 框架 | React 19（函数组件 + hooks） |
| 语言 | TypeScript（strict） |
| 构建 | Vite 6 |
| 路由 | TanStack Router（虚拟文件路由，`src/routes.ts` 定义，`src/routeTree.gen.ts` 自动生成） |
| 数据 | TanStack Query 5 |
| 组件库 | Ant Design 6 + ProComponents 3 |
| 样式 | Tailwind CSS v4（`@theme` 定义主题） |
| 国际化 | LinguiJS 5（message-as-id + 宏） |
| 校验 | zod（环境变量） |
| 请求 | `@dune2/tools/rq` 的 `RequestBuilder` |
| 工具库 | es-toolkit（有现成方法就用它，不自己实现） |
| 测试 | Vitest + Testing Library（jsdom） |
| Lint | oxlint（`.oxlintrc.json`） |
| Git 钩子 | husky + lint-staged |

## 2. 目录结构

```
src/
├── apis/             # dune 生成的接口客户端（生成产物，不手改）
├── constants/        # 模块级常量（auth / routes / menu / locale / users / timing / layout / http）
├── layouts/          # 布局（AdminLayout 等）——不放 components/
├── routes/           # 路由文件（__root / index / users / settings / login）
├── routes.ts         # 虚拟文件路由树（Virtual File Routes）
├── components/       # 通用组件
├── i18n/             # I18nProvider + locales/{en,zh}/messages.po
├── lib/              # env / request / router / queryClient / auth / theme
├── main.tsx          # 入口
└── index.css         # Tailwind + @theme 主题变量
helm/                 # 环境变量唯一来源（values*.yaml + chart）
scripts/sync-env.mjs  # helm values → .env.<mode>
swagger/              # swagger/openapi.json 输入（不入库）
dune.config.ts        # dune 接口代码生成配置
plugins/              # 自定义 oxlint 插件（按关注点拆分，jsPlugins）
tests/                # 测试（单测 / 组件测试的唯一位置）
docs/                 # 文档（索引见 docs/index.md）
├── index.md          # 全部 md 文档索引
├── README.md
├── harness/spec.md   # 本文件（规范）
├── specs/            # 技术方案（正文）
├── .template/        # 可复制模板（技术方案 / bugfix）
└── .scripts/         # 约束 AI 的门禁脚本
```

目录约定：插件类（如自定义 oxlint 插件）放 `plugins/`；测试放 `tests/`；模块级常量放 `src/constants/`。

路由使用 **Virtual File Routes**：`src/routes.ts` 用 `rootRoute` / `index` / `route` 显式声明路由树，指向 `src/routes/` 下的真实文件；vite 的 TanStackRouter 插件据此生成 `src/routeTree.gen.ts`。新增页面时，`src/routes.ts` 与对应的路由文件两处都要改。

## 3. 国际化（Lingui）

- 用宏写真实文案，msgid = 英文原文：JSX 用 `<Trans>`，属性/字符串用 `t`，模块级数据用 `msg` + `_(...)`
- 禁止裸 key 写法（如 `i18n._("admin.dashboard")`）
- catalog 位置：`src/i18n/locales/{locale}/messages.po`；代码里直接 `import "./locales/en/messages.po"`，由 `@lingui/vite-plugin` 编译，无需手动 compile
- 改完文案必须跑 `pnpm extract`；新增文案要补 zh 译文
- 同一英文文案含义不同处，用 `context` 区分

## 4. 环境变量

- 唯一来源：`helm/values.yaml`（基础）+ `helm/values.<env>.yaml`（覆盖）
- 生成：`pnpm env:sync <development|production>` → `.env.<env>`；`dev` / `build` 已自动串联
- 校验：`src/lib/env.ts` 用 zod 解析 `import.meta.env`，缺失或非法即启动失败
- 新增变量：先加 helm values，再补 `src/vite-env.d.ts` 类型与 zod schema
- 本地联调：dev 用同源 `/api`，走 Vite 代理（`vite.config.ts` → `http://localhost:8080`）

## 5. 请求层与接口代码生成

- 全局拦截器在 `src/lib/request.ts`：baseURL、Bearer token、JSON 序列化、统一错误、401 清登录态
- 手写接口用 `new RequestBuilder({ url, method })`；批量接口走生成：
  - 配置：`dune.config.ts`（`swaggerJSONPath` 支持本地路径或远程 URL；`output` 默认 `./src/apis`）
  - 生成：`pnpm api:gen` → `src/apis/**`，产出基于 `@dune2/tools/rq` 的 `RequestBuilder`，并复用全局 QueryClient
  - `src/apis/` 是生成产物，**不手改**，也不参与 oxlint（见 `.oxlintrc.json` 的 `ignorePatterns`）
- 个别接口需覆盖全局行为时，用调用级 `requestFn`

## 6. 主题与样式

- 主题色只在 `src/index.css` 的 `@theme` 中定义
- 组件里用 Tailwind 变量类（`text-primary`）或 `var(--color-primary)`，不写死 hex
- antd 的 `colorPrimary` 通过 `src/lib/theme.ts` 读取 CSS 变量

## 7. 代码风格与 Lint

- 遵循现有模式，不引入新范式
- `pnpm lint`（oxlint，`correctness` 为 error，其余为 warn）与 `pnpm typecheck` 必须通过
- `.oxlintrc.json` 中被关闭的规则都有明确理由（见文件内分组），修改前先问
- 插件类放 `plugins/` 目录，按关注点拆分，通过 `.oxlintrc.json` 的 `jsPlugins` 加载（报错信息用英文）：
  - `jsx-rules/no-long-inline-callback`：JSX 属性里的回调超过 1 行必须抽成具名函数
  - `jsx-rules/max-props-per-line`：JSX props 超过 2 个时，每个 prop 单独一行
  - `design-tokens/no-hex-color`：禁止 hex 颜色，改用 `@theme` 变量
  - `architecture/constants-dir`：模块级数据常量必须放 `src/constants/`
  - `routes/no-cross-route-import`：路由文件之间不能互相 import（共用逻辑下沉到 `src/lib` / `src/components` / `src/constants`）
- `no-magic-numbers` 开启（`src/constants/**` 豁免）
- 通用工具方法优先用 `es-toolkit`（已在 dependencies 中）。es-toolkit 里已有的方法，不要自己实现，也不引入 lodash/underscore：
  - 函数控制：`debounce`、`throttle`、`once`、`memoize`
  - 集合/数组：`groupBy`、`chunk`、`uniq`、`uniqBy`、`sortBy`、`sumBy`、`partition`、`flatten`
  - 对象：`pick`、`omit`、`merge`、`cloneDeep`、`isEqual`
  - 数字/杂项：`clamp`、`range`、`sum`、`round`、`isNil`、`isEmpty`
- Lingui 用 `eslint-plugin-lingui`（同一套 `jsPlugins` 加载）；`no-unlocalized-strings` 关闭，因为 message-as-id 下 `<Trans>` 原文会被误报

## 8. 测试（Vitest）

- 运行：`pnpm test`（单次）/ `pnpm test:watch`（监听）
- 配置在 `vite.config.ts` 的 `test` 段：`environment: jsdom`、`setupFiles: tests/setup.ts`、`env.NODE_ENV=test`
- **测试代码统一放根目录 `tests/`**（`tests/setup.ts` + `*.test.ts(x)`），不在 `src/` 里写测试；由 `pnpm test:layout`（`docs/.scripts/check-tests.mjs`）门禁校验
- 纯逻辑用单元测试；组件用 `@testing-library/react` + `@testing-library/user-event`，断言用 `@testing-library/jest-dom`
- oxlint 的 `vitest` 插件规则只对测试文件启用（见 `.oxlintrc.json` 的 `overrides`）

## 9. Git 与提交

- `pre-commit`：husky 执行 lint-staged（`oxlint --fix --deny-warnings`）+ `pnpm typecheck`，失败即拦截提交
- 不要用 `--no-verify` 绕过钩子
- 生成文件不手改：`src/routeTree.gen.ts` 由插件生成，`.po` catalog 由 `pnpm extract` 维护

## 10. 边界（Always / Ask first / Never）

### ✅ Always

- 完成任务前跑 `pnpm lint && pnpm typecheck && pnpm test`
- 改动文案后跑 `pnpm extract`
- 沿用既有目录结构、命名与请求 / 文案约定
- 生成物（`.env*`、编译 catalog、`*.tsbuildinfo`）不进版本库（已 gitignore）
- 新增 / 移动文档时，同步更新 `docs/index.md` 与所在目录的 `README.md`

### ⚠️ Ask first

- 新增或升级依赖
- 修改 `.oxlintrc.json` 规则集
- 修改 `vite.config.ts` / `helm/` / CI 配置
- 调整 i18n catalog 位置或编译方式
- 大范围重命名或目录迁移

### 🚫 Never

- 提交密钥、`.env*` 或令牌
- 手改生成文件（`src/routeTree.gen.ts`、`src/apis/`、编译产物）
- 用 `--no-verify` 绕过 pre-commit
- 在组件里硬编码主题色或用户可见文案
