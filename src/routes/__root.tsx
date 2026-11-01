import {
  createRootRouteWithContext,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/layouts";
import { isAuthenticated } from "@/lib/auth";
import { PUBLIC_ROUTES } from "@/constants/routes";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const isPublic = PUBLIC_ROUTES.has(location.pathname);
    const authed = isAuthenticated();

    if (!authed && !isPublic) {
      throw redirect({ to: "/login" });
    }

    if (authed && location.pathname === "/login") {
      throw redirect({ to: "/" });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // Login page renders standalone without admin layout
  if (isLoginPage) {
    return <Outlet />;
  }

  return <AdminLayout />;
}
