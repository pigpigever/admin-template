import { createFileRoute } from "@tanstack/react-router";
import { ProCard, ProForm, ProFormText } from "@ant-design/pro-components";
import { App as AntdApp } from "antd";
import { t } from "@lingui/core/macro";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { message } = AntdApp.useApp();

  function handleFinish(values: Record<string, string>) {
    message.success(t`Saved: ${JSON.stringify(values)}`);
  }

  return (
    <div className="p-6">
      <ProCard title={t`Settings`} headerBordered>
        <ProForm
          onFinish={handleFinish}
          submitter={{
            searchConfig: {
              submitText: t`Save`,
              resetText: t`Cancel`,
            },
          }}
        >
          <ProFormText
            name="siteName"
            label={t`Site Name`}
            placeholder={t`My Admin`}
            initialValue="Admin Template"
          />
          <ProFormText
            name="adminEmail"
            label={t`Admin Email`}
            placeholder="admin@example.com"
            rules={[{ type: "email" }]}
          />
        </ProForm>
      </ProCard>
    </div>
  );
}
