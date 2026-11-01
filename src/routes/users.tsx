import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { t } from "@lingui/core/macro";
import { mockUsers, type UserRecord } from "@/constants/users";
import { USERS_LOAD_DELAY_MS } from "@/constants/timing";

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

function renderToolbar() {
  return [
    <Button
      key="add"
      type="primary"
      icon={<PlusOutlined />}
    >
      {t`Add`}
    </Button>,
  ];
}

function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, USERS_LOAD_DELAY_MS);
      });
      return mockUsers;
    },
  });

  const columns: ProColumns<UserRecord>[] = [
    {
      title: t`ID`,
      dataIndex: "id",
      width: 60,
    },
    {
      title: t`Name`,
      dataIndex: "name",
      search: true,
    },
    {
      title: t`Email`,
      dataIndex: "email",
      copyable: true,
    },
    {
      title: t`Role`,
      dataIndex: "role",
      valueType: "select",
      valueEnum: {
        admin: { text: t`Admin`, status: "Error" },
        editor: { text: t`Editor`, status: "Warning" },
        user: { text: t`User`, status: "Default" },
      },
    },
    {
      title: t`Status`,
      dataIndex: "status",
      valueType: "select",
      render: (_, record) => (
        <Tag color={record.status === "active" ? "green" : "red"}>
          {record.status === "active" ? t`Active` : t`Disabled`}
        </Tag>
      ),
      valueEnum: {
        active: { text: t`Active` },
        disabled: { text: t`Disabled` },
      },
    },
    {
      title: t`Created At`,
      dataIndex: "createdAt",
      valueType: "date",
    },
    {
      title: t`Actions`,
      valueType: "option",
      render: (_) => [
        <Button
          key="edit"
          type="link"
          size="small"
        >
          {t`Edit`}
        </Button>,
        <Popconfirm
          key="delete"
          title={t`Are you sure you want to delete this item?`}
          okText={t`Delete`}
          cancelText={t`Cancel`}
        >
          <Button
            type="link"
            size="small"
            danger
          >
            {t`Delete`}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div className="p-6">
      <ProTable<UserRecord>
        headerTitle={t`User List`}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={columns}
        search={{
          labelWidth: "auto",
        }}
        toolBarRender={renderToolbar}
        pagination={{
          pageSize: 10,
        }}
      />
    </div>
  );
}
