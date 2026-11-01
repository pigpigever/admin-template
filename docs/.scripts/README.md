# .scripts

约束 AI 的门禁脚本（quality gates）。位于 `docs/.scripts/`，可被 `.husky/pre-commit`、CI 或手动调用。

- [check-docs.mjs](./check-docs.mjs) — 文档结构校验：`AGENTS.md` 的 `@docs/...` 引用可解析、`docs/` 下每个 md 都被 `docs/index.md` 收录、每个 docs 子目录都有 `README.md`
- [check-tests.mjs](./check-tests.mjs) — 测试布局校验：测试文件只能在根目录 `tests/` 下，且 `tests/` 至少有一个测试

约定：

- 纯 Node（ESM，`.mjs`），不引额外依赖，跨平台
- 通过时退出码 0，失败时 `process.exitCode = 1` 并列出问题
- 新增门禁脚本后，在本文件与 [index.md](./index.md) 补一行说明
