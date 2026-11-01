import { defineConfig } from "@dune2/cli";

export default defineConfig({
  api: [
    {
      // 生成文件输出目录
      output: "./src/apis",
      // Swagger/OpenAPI JSON：可以是本地路径，也可以是远程 URL
      swaggerJSONPath: "./swagger/openapi.json",
      // 复用应用的 QueryClient：全局已由 src/lib/request.ts 的
      // RequestBuilder.setQueryClientFactory 指定，这里无需再配 queryClientImportPath
    },
  ],
});
