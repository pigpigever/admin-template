# 主题与样式

- 主题色只在 `src/index.css` 的 `@theme` 中定义
- 组件里用 Tailwind 变量类（`text-primary`）或 `var(--color-primary)`，不写死 hex
- antd 的 `colorPrimary` 通过 `src/lib/theme.ts` 读取 CSS 变量
