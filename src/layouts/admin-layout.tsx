import { useState, type ReactNode } from "react";
import { ProLayout, type MenuDataItem } from "@ant-design/pro-components";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { LogoutOutlined } from "@ant-design/icons";
import { useLingui } from "@lingui/react";
import { t } from "@lingui/core/macro";
import { useI18n, type Locale } from "@/i18n";
import { Select, Space, Dropdown, Avatar, message } from "antd";
import { clearAuth, getAuthUser } from "@/lib/auth";
import { menuRoutes } from "@/constants/menu";

function renderMenuItem(item: MenuDataItem, dom: ReactNode) {
  return (
    <Link to={item.path!} style={{ display: "block" }}>
      {dom}
    </Link>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { _ } = useLingui();
  const { locale, setLocale } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const user = getAuthUser();

  const menuData = menuRoutes.map((route) => ({
    ...route,
    name: _(route.name),
  }));

  const handleLogout = () => {
    clearAuth();
    message.success(t`Logged out successfully`);
    navigate({ to: "/login" });
  };

  function renderActions() {
    return (
      <Space size="middle">
        <Select<Locale>
          value={locale}
          onChange={(val) => setLocale(val)}
          size="small"
          options={[
            { value: "en", label: "English" },
            { value: "zh", label: "中文" },
          ]}
          style={{ width: 100 }}
        />
        <Dropdown
          menu={{
            items: [
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: t`Logout`,
                onClick: handleLogout,
              },
            ],
          }}
          placement="bottomRight"
        >
          <Space style={{ cursor: "pointer" }}>
            <Avatar
              size="small"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {user?.username?.charAt(0).toUpperCase() ?? "U"}
            </Avatar>
            <span className="text-sm hidden sm:inline">
              {user?.username ?? t`User`}
            </span>
          </Space>
        </Dropdown>
      </Space>
    );
  }

  return (
    <ProLayout
      title="Admin"
      logo={false}
      layout="mix"
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{
        pathname: location.pathname,
      }}
      route={{
        path: "/",
        routes: menuData,
      }}
      menuItemRender={renderMenuItem}
      actionsRender={renderActions}
      // Logout button at the bottom of the sidebar
      siderWidth={216}
    >
      <Outlet />
    </ProLayout>
  );
}
