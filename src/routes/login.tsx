import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { App as AntdApp, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { loginApi, setAuthUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  async function handleFinish(values: Record<string, string>) {
    try {
      const user = await loginApi(values.username, values.password);
      setAuthUser(user);
      message.success(t`Login successful`);
      navigate({ to: "/" });
    } catch (error) {
      message.error(error instanceof Error ? error.message : t`Login failed`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-[460px] shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="m-0 text-2xl font-bold text-primary">
            Admin Template
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            <Trans>Sign in to your account</Trans>
          </p>
        </div>

        <LoginForm
          onFinish={handleFinish}
          submitter={{
            searchConfig: {
              submitText: t`Sign In`,
            },
            submitButtonProps: {
              block: true,
              size: "large",
            },
          }}
        >
          <ProFormText
            name="username"
            placeholder="admin"
            fieldProps={{
              size: "large",
              prefix: <UserOutlined />,
            }}
            rules={[
              {
                required: true,
                message: t`Please enter username`,
              },
            ]}
          />
          <ProFormText.Password
            name="password"
            placeholder="123456"
            fieldProps={{
              size: "large",
              prefix: <LockOutlined />,
            }}
            rules={[
              {
                required: true,
                message: t`Please enter password`,
              },
            ]}
          />
          <div className="mt-2 text-center text-xs text-gray-400">
            {t`Demo: admin / 123456`}
          </div>
        </LoginForm>
      </Card>
    </div>
  );
}
