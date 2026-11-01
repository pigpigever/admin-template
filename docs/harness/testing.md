# 测试（Vitest）

- 运行：`pnpm test`（单次）/ `pnpm test:watch`（监听）/ `pnpm test:coverage`（覆盖率）
- 配置在 `vite.config.ts` 的 `test` 段：`environment: jsdom`、`setupFiles: tests/setup.ts`、`env.NODE_ENV=test`
- 覆盖率阈值在 `test.coverage.thresholds`，只升不降；报告输出到 `coverage/`（已 gitignore）
- **测试代码统一放根目录 `tests/`**（`tests/setup.ts` + `*.test.ts(x)`），不在 `src/` 里写测试；由 `pnpm test:layout`（`docs/.scripts/check-tests.mjs`）门禁校验
- 纯逻辑用单元测试；组件用 `@testing-library/react` + `@testing-library/user-event`，断言用 `@testing-library/jest-dom`
- oxlint 的 `vitest` 插件规则只对测试文件启用（见 `.oxlintrc.json` 的 `overrides`）
- 测试里不要用 `console.log` 作为输出或断言；需要观察值用断言 / `expect`，调试后删除临时输出
- 默认 TDD：写失败测试 → 确认红 → 最小实现 → 确认绿 → 重构 → `pnpm verify`
- 新增 / 修改 `src/` 行为前先写测试；bugfix 先写复现测试；测试与实现放同一 commit
- 测试基础设施用 `tests/test-utils.tsx` 与 `tests/factories/`，不在用例里重复搭 provider 或手写用户对象
- pre-commit 会跑 `pnpm test`；禁止 `test.only`、条件测试、条件断言
- 纯配置 / 生成物、纯样式调整、探索性 spike 可例外；spike 合并前必须补测试或说明原因
