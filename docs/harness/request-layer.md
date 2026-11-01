# 请求层与接口代码生成

- 全局拦截器在 `src/lib/request.ts`：baseURL、Bearer token、JSON 序列化、统一错误、401 清登录态
- 手写接口用 `new RequestBuilder({ url, method })`；批量接口走生成：
  - 配置：`dune.config.ts`（`swaggerJSONPath` 支持本地路径或远程 URL；`output` 默认 `./src/apis`）
  - 生成：`pnpm api:gen` → `src/apis/**`，产出基于 `@dune2/tools/rq` 的 `RequestBuilder`，并复用全局 QueryClient
  - `src/apis/` 是生成产物，**不手改**，也不参与 oxlint（见 `.oxlintrc.json` 的 `ignorePatterns`）
- 个别接口需覆盖全局行为时，用调用级 `requestFn`
