import { msg } from "@lingui/core/macro";
import {
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export const menuRoutes = [
  {
    path: "/",
    name: msg`Dashboard`,
    icon: <DashboardOutlined />,
  },
  {
    path: "/users",
    name: msg`User Management`,
    icon: <TeamOutlined />,
  },
  {
    path: "/settings",
    name: msg`Settings`,
    icon: <SettingOutlined />,
  },
];
