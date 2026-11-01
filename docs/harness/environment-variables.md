# 环境变量

- 唯一来源：`helm/values.yaml`（基础）+ `helm/values.<env>.yaml`（覆盖）
- 生成：`pnpm env:sync <development|production>` → `.env.<env>`；`dev` / `build` 已自动串联
- 校验：`src/lib/env.ts` 用 zod 解析 `import.meta.env`，缺失或非法即启动失败
- 新增变量：先加 helm values，再补 `src/vite-env.d.ts` 类型与 zod schema
- 本地联调：dev 用同源 `/api`，走 Vite 代理（`vite.config.ts` → `http://localhost:8080`）
