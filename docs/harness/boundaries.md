# 边界（Always / Ask first / Never）

## ✅ Always

- 完成任务前跑 `pnpm lint && pnpm typecheck && pnpm test`（全量用 `pnpm verify`）
- 改动文案后跑 `pnpm extract`
- 沿用既有目录结构、命名与请求 / 文案约定
- 生成物（`.env*`、编译 catalog、`*.tsbuildinfo`）不进版本库（已 gitignore）
- 新增 / 移动文档时，同步更新 `docs/index.md` 与所在目录的 `README.md`

## ⚠️ Ask first

- 新增或升级依赖
- 修改 `.oxlintrc.json` 规则集
- 修改 `vite.config.ts` / `helm/` / CI 配置
- 调整 i18n catalog 位置或编译方式
- 大范围重命名或目录迁移

## 🚫 Never

- 提交密钥、`.env*` 或令牌
- 手改生成文件（`src/routeTree.gen.ts`、`src/apis/`、编译产物）
- 用 `--no-verify` 绕过 pre-commit
- 在组件里硬编码主题色或用户可见文案
