# 项目概览与技术栈

单页管理后台模板（SPA，非 SSR），基于 Vite。

| 领域 | 选型 |
| --- | --- |
| UI 框架 | React 19（函数组件 + hooks） |
| 语言 | TypeScript（strict） |
| 构建 | Vite 6 |
| 路由 | TanStack Router（虚拟文件路由，`src/routes.ts` 定义，`src/routeTree.gen.ts` 自动生成） |
| 数据 | TanStack Query 5 |
| 组件库 | Ant Design 6 + ProComponents 3 |
| 样式 | Tailwind CSS v4（`@theme` 定义主题） |
| 国际化 | LinguiJS 5（message-as-id + 宏） |
| 校验 | zod（环境变量） |
| 请求 | `@dune2/tools/rq` 的 `RequestBuilder` |
| 工具库 | es-toolkit（有现成方法就用它，不自己实现） |
| 测试 | Vitest + Testing Library（jsdom） |
| Lint | oxlint（`.oxlintrc.json`） |
| Git 钩子 | husky + lint-staged |
