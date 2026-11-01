# .template

可复制的文档模板。新增模板时同步更新 [index.md](./index.md) 与 [../index.md](../index.md)。

- [technical-design.md](./technical-design.md) — 技术方案模板
- [bugfix.md](./bugfix.md) — bugfix 模板

约定：

- 模板里的 `<...>`、`TODO` 是占位，提交前替换或删除
- 方案落地时遵循 [../harness/spec.md](../harness/spec.md) 与根目录 `AGENTS.md` 的约定
- 与代码相关的命令统一用项目脚本：`pnpm lint` / `pnpm typecheck` / `pnpm test`
