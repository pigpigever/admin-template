# 技术方案：基于 Vitest 的 TDD 工作流

| 项 | 内容 |
| --- | --- |
| 状态 | Draft |
| 作者 | opencode |
| 日期 | 2026-11-01 |
| 版本 | v0.4 |
| 关联 | [ai-quality-gates.md](../ai-quality-gates.md) / [testing.md](../../harness/testing.md) |

## 变更记录

| 版本 | 日期 | 变更 | 作者 |
| --- | --- | --- | --- |
| v0.4 | 2026-11-01 | 开启覆盖率门禁：基线 53.71% / 31.25% / 37.83% / 56.14%，阈值 50 / 30 / 35 / 55 | opencode |
| v0.3 | 2026-11-01 | 落地 P0 与 pre-commit 测试：test-utils / factories / parseEnv / 路由 history / 测试补充 | opencode |
| v0.2 | 2026-11-01 | 调整：测试门禁放 pre-commit，不新增 CI 测试 job | opencode |
| v0.1 | 2026-11-01 | 初稿：基于 Vitest 的 TDD 工作流、测试基础设施与门禁方案 | opencode |

## 1. 背景与问题

项目已有 Vitest + Testing Library 基础设施，`tests/` 下 5 个测试文件、21 个用例，覆盖 auth / request / theme / i18n / agent guard。但测试是「事后补」的：

- 没有明确规定「先写失败测试，再写实现」
- 页面、布局、路由守卫几乎没有测试，回归主要靠手点
- 没有覆盖率门禁，测试门禁也不在 pre-commit 强制执行
- 测试基础设施散落在各文件：provider、QueryClient、Router、localStorage 重置都要临时拼
- Agent 完成任务时，默认先改代码，测试只是可选项

结果：核心逻辑改动没有安全网，页面交互回归成本高，AI 生成的代码也缺少可验证的行为边界。

## 2. 目标与非目标

**目标**

- 把 TDD 固化为默认开发流程：红 → 绿 → 重构，每个行为先有失败测试
- 统一测试基础设施：provider、QueryClient、Router、清理逻辑、测试数据工厂
- 明确测试分层与放置规则，避免「什么都写 E2E」或「只测纯函数」
- 引入覆盖率基线与门禁，先测量再设阈值，只升不降
- 让 Agent 在 `AGENTS.md` / testing 规范里能直接执行 TDD，而不是靠口头约定
- 用现有 Vitest 5 + Testing Library，不引入第二套测试框架

**非目标**

- 不引入 Playwright / Cypress 等浏览器 E2E（后续单独评估）
- 不追求 100% 覆盖率，也不把覆盖率当唯一质量指标
- 不要求 UI 快照测试
- 不在本方案内迁移 `docs/specs/` 的平铺文档（见 [organize-specs-by-module.md](../organize-specs-by-module.md)）
- 不改造业务功能，只为可测性做必要的 seam 提取

## 3. 方案概览

采用「Testing Trophy」偏集成的方式，按成本从低到高分层：

```
        E2E / 浏览器          （本方案不做，非目标）
     路由 / 页面集成测试      （TanStack Router + Testing Library）
   组件 / Hook 交互测试       （Testing Library + user-event）
 纯函数 / 模块单元测试        （Vitest）
     静态检查 / 类型检查       （lint / tsc，已有）
```

TDD 循环固定为：

```
写一个失败测试 → 运行并确认「红」→ 写最小实现 → 运行变「绿」→ 重构 → 全量 verify
```

每条行为一个循环，不批量写一堆测试再一次性实现。提交时测试和实现放在同一个 commit。

## 4. 详细设计

### 4.1 测试分层与目录

测试仍然全部放根目录 `tests/`，由 `pnpm test:layout` 强制。目录按被测对象分组，不按页面文件镜像：

```
tests/
├── setup.ts                 # jest-dom + cleanup（已有）
├── test-utils.tsx           # provider / router / query client helpers（新增）
├── factories/               # 测试数据工厂（新增）
│   └── auth.ts
├── lib/                     # 纯函数 / 模块
│   ├── auth.test.ts
│   ├── env.test.ts
│   ├── request.test.ts
│   └── theme.test.ts
├── routes/                  # 路由 / 页面集成
│   ├── auth-guard.test.tsx
│   ├── login.test.tsx
│   ├── users.test.tsx
│   ├── settings.test.tsx
│   └── dashboard.test.tsx
├── layouts/
│   └── admin-layout.test.tsx
├── i18n/
│   └── index.test.tsx
└── agent/
    └── guard.test.mjs
```

规则：

- 单元测试放 `tests/lib/`、`tests/agent/`；组件 / 页面测试放 `tests/routes/`、`tests/layouts/`
- 一个测试文件对应一个主要被测单元；不要把整个页面和它的依赖塞进一个巨型 spec
- 文件名 kebab-case，和源文件保持可读映射（`admin-layout.tsx` → `admin-layout.test.tsx`）
- 共享 helper 不算测试文件，不参与 `test:layout` 的测试文件计数，但仍在 `tests/` 下

### 4.2 TDD 循环与命令

以新增 `loginApi` 行为为例：

```bash
# 1. 写失败测试后，只跑这个文件
pnpm test tests/lib/auth.test.ts

# 2. 只跑某个用例
pnpm test tests/lib/auth.test.ts -t "rejects invalid credentials"

# 3. 开发时监听
pnpm test:watch tests/lib/auth.test.ts

# 4. 完成前全量
pnpm verify
```

每个循环的完成标准：

1. 先看到测试失败，且失败原因符合预期（不是语法错误、不是 mock 没配好）
2. 实现后只让该行为变绿，不顺手改无关代码
3. 重构后测试仍然绿
4. 该行为至少有一个正向用例；有边界 / 错误分支时补反向用例

**什么时候可以不先写测试**

- 纯配置 / 生成物：`vite.config.ts`、`routeTree.gen.ts`、`src/apis/`
- 纯样式调整，且没有行为变化
- 探索性 spike：允许先写代码，但合并前必须补测试或明确记录不补的理由

### 4.3 测试基础设施

新增 `tests/test-utils.tsx`，统一 provider 和测试上下文：

```tsx
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { App as AntdApp } from "antd";
import { I18nProvider } from "@/i18n";
import { createAppRouter } from "@/lib/router";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  { queryClient = createTestQueryClient() } = {}
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AntdApp>{ui}</AntdApp>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export function renderRoute(
  route: string,
  { queryClient = createTestQueryClient() } = {}
) {
  const router = createAppRouter(queryClient, {
    history: createMemoryHistory({ initialEntries: [route] }),
  });
  render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </I18nProvider>
    </QueryClientProvider>
  );
  return { router, queryClient };
}
```

配套改动：

- `src/lib/router.tsx` 的 `createAppRouter` 增加第二个可选参数 `{ history }`，保持 `main.tsx` 现有调用兼容
- `tests/setup.ts` 增加全局 `localStorage.clear()` / `sessionStorage.clear()`，避免用例串数据
- `tests/factories/` 提供 `makeAuthUser(overrides)` 等工厂，禁止在每个用例里重复手写对象
- 异步等待统一用 `findBy*` / `waitFor`；延时逻辑用 `vi.useFakeTimers()`，不用真实 sleep
- 需要 `matchMedia` / `ResizeObserver` 时在 `tests/setup.ts` 补 polyfill，不在每个文件里重复

### 4.4 测试优先级与现有缺口

P0：先补纯函数和已经有明确行为的模块，建立节奏。

| 目标 | 测试类型 | 首批用例 |
| --- | --- | --- |
| `src/lib/auth.ts` | 单元 | `loginApi` 成功 / 失败 / 延时；`getAuthUser` 损坏数据（已有） |
| `src/lib/request.ts` | 单元 | 401 清登录态、Authorization 头、空 query 过滤、204（部分已有） |
| `src/lib/env.ts` | 单元 | 默认值、缺失必填、非法值；需要拆出 `parseEnv(source)` 纯函数 |
| `src/lib/router.tsx` | 单元 / 集成 | 路由上下文注入 queryClient |

P1：路由守卫和登录闭环，这是最容易回归的路径。

| 目标 | 测试类型 | 首批用例 |
| --- | --- | --- |
| `src/routes/__root.tsx` | 集成 | 未登录访问 `/` → `/login`；已登录访问 `/login` → `/`；公开路由放行 |
| `src/routes/login.tsx` | 集成 | 必填校验、登录成功写入 auth 并跳转、登录失败提示 |
| `src/layouts/admin-layout.tsx` | 集成 | 语言切换、登出清 auth 并跳转、菜单渲染 |

P2：页面数据与交互。

| 目标 | 测试类型 | 首批用例 |
| --- | --- | --- |
| `src/routes/users.tsx` | 集成 | loading → 表格数据、角色 / 状态渲染 |
| `src/routes/settings.tsx` | 集成 | 邮箱校验、保存成功提示 |
| `src/routes/index.tsx` | 集成 | 指标 loading → 数值展示 |

页面测试原则：

- 优先断言用户可见结果（role / label / text），少用 `data-testid`
- 不测 Ant Design 内部实现，不依赖 class 名和 DOM 层级
- 不写全页快照；快照只用于稳定的纯展示组件，且要说明原因
- 异步请求通过 mock `fetch` / mock 模块边界控制，不 mock 被测组件本身

### 4.5 覆盖率与门禁

已新增开发依赖 `@vitest/coverage-v8`，并增加脚本：

```json
"test:coverage": "vitest run --coverage"
```

`vite.config.ts` 的 `test.coverage`：

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "html", "lcov"],
  include: ["src/**/*.{ts,tsx}"],
  exclude: [
    "src/routeTree.gen.ts",
    "src/apis/**",
    "src/main.tsx",
    "src/**/*.d.ts",
  ],
  thresholds: {
    lines: 55,
    statements: 50,
    functions: 35,
    branches: 30,
  },
}
```

基线（2026-11-01）：lines 56.14% / statements 53.71% / functions 37.83% / branches 31.25%，阈值按向下取整到 5 的倍数设置。

执行策略：

1. 先跑一次 `pnpm test:coverage` 记录基线
2. 初始阈值取「基线向下取整到 5 的倍数」，不要凭空定高
3. 之后只升不降；每次提升先补测试再调阈值
4. 覆盖率不替代行为断言：禁止为了数字写无意义测试
5. `src/main.tsx` 是启动装配，排除；路由 / 页面仍计入

门禁分层：

| 层 | 命令 | 时机 |
| --- | --- | --- |
| 本地快速 | `pnpm test <file>` | TDD 循环 |
| 提交前 | `lint-staged` + `pnpm typecheck` + `pnpm test`（现有 pre-commit 已补 `pnpm test`） | commit |
| 合并前 | `pnpm verify`（已含 test） | 本地 |
| 覆盖率 | `pnpm test:coverage` | 发版前或按需 |

测试门禁只放 pre-commit，不新增 CI 测试 job。当前测试规模小（5 个文件 / 23 个用例，约 1 秒），pre-commit 跑全量 `pnpm test` 成本可接受；等测试明显变慢后，再评估 `vitest related --run <changed files>` 或拆分 pre-push，但不改变「pre-commit 是唯一强制测试门禁」的定位。

### 4.6 Agent 执行约定

在 `AGENTS.md` 的 Standing rules 和 `docs/harness/testing.md` 增加：

- 新增 / 修改 `src/` 行为前，先在 `tests/` 写失败测试并确认红
- Bugfix 必须先写复现测试，再改实现
- 测试和实现放在同一个 commit；禁止「先合代码，测试下个 PR 补」
- 禁止 `test.only`、条件测试、条件断言（oxlint 已有 `vitest/*` 规则）
- 不 mock 被测模块本身；只 mock 网络、存储、时间、随机数等边界
- 测试名用英文、描述行为，不用「works」「test1」
- 完成前必须跑 `pnpm verify`；提交时 pre-commit 会跑 `pnpm test`；涉及覆盖率时跑 `pnpm test:coverage`
- 确实无法测试时，在 PR / 回复中说明原因，并得到确认

### 4.7 与现有约定的关系

- 文案：测试里触发 UI 时使用可见英文文案；切到 zh 时断言译文，避免硬编码 key
- 环境变量：测试不读真实 `.env`，通过 `vi.stubEnv` / `parseEnv(source)` 注入
- 请求：继续 mock `fetch` 或 `RequestBuilder` 边界，不绕开 `src/lib/request.ts`
- 主题：沿用 `cssVar` 测试方式，不依赖真实浏览器计算样式
- 常量 / 路由：测试不复制业务常量，直接 import；测试数据放 factories
- 测试布局：继续由 `pnpm test:layout` 强制 `tests/` 目录

## 5. 备选方案与取舍

| 方案 | 优点 | 缺点 | 是否采用 |
| --- | --- | --- | --- |
| A. TDD + Testing Trophy（本方案） | 反馈快，覆盖行为，成本可控 | 需要团队纪律和测试基础设施 | ✅ |
| B. 先写代码，合并前补测试 | 短期快 | 测试容易变成「实现复述」，回归保护弱 | ❌ |
| C. 只做 E2E / Playwright | 最接近真实用户 | 慢、脆、定位难，开发循环不适用 | ❌ |
| D. 只追覆盖率数字 | 指标直观 | 容易写无意义测试，掩盖真实风险 | ❌ |

选择 A：Vitest 已在项目里，Testing Library 也已配置；补基础设施的成本最低，能直接服务 Agent 的日常改动。

## 6. 影响面、兼容性与迁移

- 影响范围：开发流程、`tests/`、`vite.config.ts`、`package.json`、`AGENTS.md`、`docs/harness/testing.md`
- 生产代码：只做可测性 seam（`parseEnv`、`createAppRouter` 可选 history），不改变运行时行为
- 依赖：新增 `@vitest/coverage-v8`（devDependency），需确认
- 门禁：不新增 CI 测试 job；在现有 pre-commit 上增加 `pnpm test`，本地 `pnpm verify` 仍是底线
- 数据迁移：无
- 回滚：移除 coverage 依赖 / 脚本 / 阈值即可；测试文件可保留，不影响构建

## 7. 测试计划（本方案自身）

- [ ] `tests/test-utils.tsx` 能被 `tests/routes/*` 复用，provider 不重复
- [ ] `renderRoute` 能覆盖未登录重定向、已登录跳转
- [x] `loginApi` 用 fake timers 测成功 / 失败，不产生真实等待
- [x] `parseEnv` 覆盖默认值、缺失、非法值
- [x] `pnpm test` 全绿，`pnpm test:layout` 通过
- [x] `pnpm test:coverage` 能产出报告，阈值生效
- [x] pre-commit 能拦截失败测试
- [x] `pnpm verify` 通过

## 8. 上线与回滚

这不是运行时功能，按文档 / 流程发布：

1. 先合入规范与 `test-utils`，不改变生产行为
2. 按 P0 → P1 → P2 补测试，每批独立 PR
3. 覆盖率阈值在基线测量后单独 PR 开启
4. 如测试基础设施引起不稳定，回滚对应 helper / 配置，不影响业务代码

## 9. 风险与开放问题

| 风险 / 问题 | 影响 | 缓解措施 / 待定 |
| --- | --- | --- |
| Ant Design + jsdom 的布局 / 异步告警 | 页面测试不稳定 | 先补 `matchMedia` / `ResizeObserver` polyfill；必要时缩小断言范围 |
| Router 测试需要 memory history | 路由守卫测试成本高 | `createAppRouter` 增加可选 `history`，提供 `renderRoute` |
| 覆盖率阈值过高 | 为了数字写无效测试 | 先测基线，再按 5 的倍数取整；只升不降 |
| 新依赖需要审批 | 阻塞 P1 | 已确认并加入 `@vitest/coverage-v8` |
| pre-commit 全量测试变慢 | 提交体验下降 | 当前规模约 1 秒；变慢后再评估 `vitest related --run` 或拆分 pre-push |
| 页面测试依赖 mock 数据 | 与真实接口脱节 | 只 mock 边界；后续可替换为 MSW（需评估依赖） |
| 测试变成实现复述 | 重构时大量失败 | 断言用户行为 / 公开契约，不测内部 state 和私有函数 |

**已确认**

- 新增 `@vitest/coverage-v8`，覆盖率阈值按基线向下取整开启
- pre-commit 跑 `pnpm test`，不新增 CI 测试 job；暂不引入 `vitest related`

## 10. 验收标准

- [x] `AGENTS.md` 与 `docs/harness/testing.md` 明确 TDD 流程和「先红后绿」
- [x] `tests/test-utils.tsx`、`tests/factories/` 落地，页面测试不再重复搭 provider
- [x] P0 的 auth / request / env 测试补齐并通过
- [ ] P1 的登录、重定向、登出、语言切换有集成测试
- [x] `pnpm test:coverage` 可运行，基线已记录，阈值已开启
- [x] pre-commit 执行 `pnpm test`，能拦截失败测试
- [x] 不新增 CI 测试 job
- [x] 没有 `test.only` / 条件测试 / 无意义快照
- [ ] 至少一个 bugfix 按「先写复现测试」流程完成并记录

## 11. 分阶段落地

### P0：规范与基础设施（不新增依赖）

- 更新 `AGENTS.md`、`docs/harness/testing.md`
- 新增 `tests/test-utils.tsx`、`tests/factories/`
- `createAppRouter` 支持可选 history
- 补 `loginApi`、`request` 401、`parseEnv` 测试
- 验收：`pnpm verify` 通过

### P1：pre-commit 测试与覆盖率

- [x] 在现有 pre-commit 上增加 `pnpm test`，不新增 CI 测试 job
- [x] 确认并安装 `@vitest/coverage-v8`
- [x] 增加 `test:coverage`、`coverage` 配置、基线阈值
- [x] 验收：pre-commit 能拦截失败测试；覆盖率报告可产出，低于阈值失败

### P2：页面与路由集成

- 补 `tests/routes/` 与 `tests/layouts/` 用例
- 如 pre-commit 因全量测试变慢，再评估 `vitest related --run`
- 按覆盖率缺口迭代，不追求一次性补全
