import { index, rootRoute, route } from "@tanstack/virtual-file-routes";

/**
 * 虚拟文件路由（Virtual File Routes）。
 *
 * 路由树在这里显式声明，文件路径相对 `routesDirectory`（`src/routes`）。
 * 由 vite 的 TanStackRouter 插件读取，生成 `src/routeTree.gen.ts`。
 */
export const routes = rootRoute("__root.tsx", [
  index("index.tsx"),
  route("/users", "users.tsx"),
  route("/settings", "settings.tsx"),
  route("/login", "login.tsx"),
]);
