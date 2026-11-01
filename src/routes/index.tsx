import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Col, Row, Statistic, Typography } from "antd";
import {
  DollarOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { ProCard } from "@ant-design/pro-components";
import { COL_SPAN, GRID_GUTTER } from "@/constants/layout";
import { DASHBOARD_LOAD_DELAY_MS } from "@/constants/timing";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Simulated API call
      await new Promise((resolve) => {
        setTimeout(resolve, DASHBOARD_LOAD_DELAY_MS);
      });
      return {
        totalSales: 126_560,
        visits: 8846,
        orders: 6560,
        activeUsers: 1024,
      };
    },
  });

  return (
    <div className="p-6">
      <Typography.Title level={4}>
        <Trans>Welcome to the Admin Template</Trans>
      </Typography.Title>

      <Row gutter={GRID_GUTTER}>
        <Col
          xs={COL_SPAN.xs}
          sm={COL_SPAN.sm}
          lg={COL_SPAN.lg}
        >
          <ProCard loading={isLoading}>
            <Statistic
              title={t`Total Sales`}
              value={data?.totalSales ?? 0}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </ProCard>
        </Col>
        <Col
          xs={COL_SPAN.xs}
          sm={COL_SPAN.sm}
          lg={COL_SPAN.lg}
        >
          <ProCard loading={isLoading}>
            <Statistic
              title={t`Daily Visits`}
              value={data?.visits ?? 0}
              prefix={<EyeOutlined />}
            />
          </ProCard>
        </Col>
        <Col
          xs={COL_SPAN.xs}
          sm={COL_SPAN.sm}
          lg={COL_SPAN.lg}
        >
          <ProCard loading={isLoading}>
            <Statistic
              title={t`Orders`}
              value={data?.orders ?? 0}
              prefix={<ShoppingCartOutlined />}
            />
          </ProCard>
        </Col>
        <Col
          xs={COL_SPAN.xs}
          sm={COL_SPAN.sm}
          lg={COL_SPAN.lg}
        >
          <ProCard loading={isLoading}>
            <Statistic
              title={t`Active Users`}
              value={data?.activeUsers ?? 0}
              prefix={<UserOutlined />}
            />
          </ProCard>
        </Col>
      </Row>

      <Row gutter={GRID_GUTTER} className="mt-4">
        <Col span={24}>
          <ProCard title={t`ProComponents Demo`} headerBordered>
            <Typography.Paragraph>
              <Trans>
                This template integrates React 19, TanStack Router + Query,
                Ant Design + ProComponents, Tailwind CSS v4, and LinguiJS for
                internationalization.
              </Trans>
            </Typography.Paragraph>
          </ProCard>
        </Col>
      </Row>
    </div>
  );
}
