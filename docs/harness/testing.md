# 测试（Vitest）

- 运行：`pnpm test`（单次）/ `pnpm test:watch`（监听）
- 配置在 `vite.config.ts` 的 `test` 段：`environment: jsdom`、`setupFiles: tests/setup.ts`、`env.NODE_ENV=test`
- **测试代码统一放根目录 `tests/`**（`tests/setup.ts` + `*.test.ts(x)`），不在 `src/` 里写测试；由 `pnpm test:layout`（`docs/.scripts/check-tests.mjs`）门禁校验
- 纯逻辑用单元测试；组件用 `@testing-library/react` + `@testing-library/user-event`，断言用 `@testing-library/jest-dom`
- oxlint 的 `vitest` 插件规则只对测试文件启用（见 `.oxlintrc.json` 的 `overrides`）
- 测试里不要用 `console.log` 作为输出或断言；需要观察值用断言 / `expect`，调试后删除临时输出
