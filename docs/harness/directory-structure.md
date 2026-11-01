# 目录结构

```
src/
├── apis/             # dune 生成的接口客户端（生成产物，不手改）
├── constants/        # 模块级常量（auth / routes / menu / locale / users / timing / layout / http）
├── layouts/          # 布局（AdminLayout 等）——不放 components/
├── routes/           # 路由文件（__root / index / users / settings / login）
├── routes.ts         # 虚拟文件路由树（Virtual File Routes）
├── components/       # 通用组件
├── i18n/             # I18nProvider + locales/{en,zh}/messages.po
├── lib/              # env / request / router / query-client / auth / theme
├── main.tsx          # 入口
└── index.css         # Tailwind + @theme 主题变量
helm/                 # 环境变量唯一来源（values*.yaml + chart）
scripts/sync-env.mjs  # helm values → .env.<mode>
swagger/              # swagger/openapi.json 输入（不入库）
dune.config.ts        # dune 接口代码生成配置
plugins/              # 自定义 oxlint 插件（按关注点拆分，jsPlugins）
tests/                # 测试（单测 / 组件测试的唯一位置）
docs/                 # 文档（索引见 docs/index.md）
├── index.md          # 全部 md 文档索引
├── README.md
├── harness/          # 详细规范（入口 harness/index.md）
├── specs/            # 技术方案（正文）
├── skills/           # Agent 技能
├── .template/        # 可复制模板（技术方案 / bugfix）
└── .scripts/         # 约束 AI 的门禁脚本
```

目录约定：插件类（如自定义 oxlint 插件）放 `plugins/`；测试放 `tests/`；模块级常量放 `src/constants/`。

路由使用 **Virtual File Routes**：`src/routes.ts` 用 `rootRoute` / `index` / `route` 显式声明路由树，指向 `src/routes/` 下的真实文件；vite 的 TanStackRouter 插件据此生成 `src/routeTree.gen.ts`。新增页面时，`src/routes.ts` 与对应的路由文件两处都要改。
