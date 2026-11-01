# 环境变量

- 唯一来源：`helm/values.yaml`（基础）+ `helm/values.dev.yaml` / `helm/values.prod.yaml`（覆盖）
- 生成：`pnpm env:sync <dev|prod>` → `.env.dev` / `.env.prod`；`pnpm dev` / `pnpm build` 已自动串联，并分别以 `--mode dev` / `--mode prod` 启动 Vite
- 校验：`src/lib/env.ts` 用 zod 解析 `import.meta.env`，缺失或非法即启动失败
- 新增变量：helm values、`src/vite-env.d.ts` 类型、zod schema 三处都要改
- 校验时机：`pnpm build` 不执行 zod；缺失 / 非法变量会在浏览器启动时失败，而不是 Helm 部署阶段
- 本地联调：dev 用同源 `/api`，走 Vite 代理（`vite.config.ts` → `http://localhost:8080`）
