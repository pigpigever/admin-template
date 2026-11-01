# Git 与提交

- `pre-commit`：husky 执行 lint-staged（`oxlint --fix --deny-warnings`）+ `pnpm typecheck`，失败即拦截提交
- Agent hooks：策略在 `.agent/guard-policy.json`，共享脚本在 `.agent/hooks/agent-hook.mjs`；`.opencode/`、`.claude/`、`.codex/` 只做接线。`Stop` 阶段运行 `pnpm verify`
- 不要用 `--no-verify` 绕过钩子；agent hooks 也会拦截该参数
- 生成文件不手改：`src/routeTree.gen.ts` 由插件生成，`.po` catalog 由 `pnpm extract` 维护
