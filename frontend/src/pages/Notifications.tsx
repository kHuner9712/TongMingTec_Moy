import { useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  TimePicker,
  Typography,
  message,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { usePermission } from "../hooks/usePermission";
import {
  notificationApi,
  type NotificationPreferenceUpdatePayload,
} from "../services/notification";
import type { Notification } from "../types";

const { Title, Text } = Typography;
const PREFERENCE_STORAGE_KEY = "moy.notification.preferences.draft";

type ReadFilter = "all" | "unread" | "read";

interface PreferenceFormValues {
  channels: Record<string, boolean>;
  muteCategories: string[];
  digestTime?: Dayjs;
}

const DEFAULT_PREFERENCES: PreferenceFormValues = {
  channels: {
    inbox: true,
    email: false,
    sms: false,
    wechat: false,
  },
  muteCategories: [],
  digestTime: dayjs("09:00", "HH:mm"),
};

function loadPreferencesDraft(): PreferenceFormValues {
  try {
    const raw = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as NotificationPreferenceUpdatePayload;
    return {
      channels: parsed.channels || DEFAULT_PREFERENCES.channels,
      muteCategories: parsed.muteCategories || [],
      digestTime: parsed.digestTime
        ? dayjs(parsed.digestTime, "HH:mm")
        : DEFAULT_PREFERENCES.digestTime,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [preferenceOpen, setPreferenceOpen] = useState(false);
  const [preferenceForm] = Form.useForm<PreferenceFormValues>();

  const isReadParam =
    readFilter === "all" ? undefined : readFilter === "read" ? true : false;

  const { data: notifications, isLoading } = useQuery(
    ["notifications", page, pageSize, isReadParam],
    () =>
      notificationApi.list({
        page,
        page_size: pageSize,
        is_read: isReadParam,
      }),
    { keepPreviousData: true },
  );

  const { data: unreadCount } = useQuery(["notifications-unread-count"], () =>
    notificationApi.unreadCount(),
  );

  const markReadMutation = useMutation(
    (notificationId: string) => notificationApi.markAsRead(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["notifications"]);
        queryClient.invalidateQueries(["notifications-unread-count"]);
      },
      onError: () => {
        message.error("Mark as read failed");
      },
    },
  );

  const markAllReadMutation = useMutation(() => notificationApi.markAllAsRead(), {
    onSuccess: () => {
      message.success("All notifications have been marked as read");
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["notifications-unread-count"]);
    },
    onError: () => {
      message.error("Mark all as read failed");
    },
  });

  const updatePreferenceMutation = useMutation(
    (payload: NotificationPreferenceUpdatePayload) =>
      notificationApi.updatePreferences(payload),
    {
      onSuccess: (_, payload) => {
        localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(payload));
        message.success("Preferences saved");
        setPreferenceOpen(false);
      },
      onError: () => {
        message.error("Save preferences failed");
      },
    },
  );

  const openPreferenceDrawer = () => {
    preferenceForm.setFieldsValue(loadPreferencesDraft());
    setPreferenceOpen(true);
  };

  const handleSavePreference = async () => {
    const values = await preferenceForm.validateFields();
    const payload: NotificationPreferenceUpdatePayload = {
      channels: values.channels,
      muteCategories: values.muteCategories || [],
      digestTime: values.digestTime?.format("HH:mm"),
    };
    updatePreferenceMutation.mutate(payload);
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (value: string) => <Text>{value}</Text>,
    },
    {
      title: "Category",
      key: "category",
      render: (_: unknown, record: Notification) =>
        record.notificationType || record.type || "-",
    },
    {
      title: "Status",
      key: "isRead",
      render: (_: unknown, record: Notification) => (
        <Tag color={record.isRead ? "default" : "processing"}>
          {record.isRead ? "Read" : "Unread"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: Notification) =>
        record.isRead ? (
          <Text type="secondary">Read</Text>
        ) : (
          <Button
            size="small"
            onClick={() => markReadMutation.mutate(record.id)}
            loading={markReadMutation.isLoading}
            disabled={!can("PERM-NTF-READ")}
          >
            Mark as read
          </Button>
        ),
    },
  ];

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            Notifications
          </Title>
          <Text type="secondary">
            Unread count: {unreadCount?.count ?? 0}
          </Text>
        </div>
        <Space>
          <Select<ReadFilter>
            value={readFilter}
            style={{ width: 160 }}
            onChange={setReadFilter}
            options={[
              { label: "All", value: "all" },
              { label: "Unread", value: "unread" },
              { label: "Read", value: "read" },
            ]}
          />
          <Button
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isLoading}
            disabled={!can("PERM-NTF-READ")}
          >
            Mark all as read
          </Button>
          <Button onClick={openPreferenceDrawer} disabled={!can("PERM-NTF-READ")}>
            Preferences
          </Button>
        </Space>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={notifications?.items || []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: notifications?.meta?.total || 0,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />

      <Drawer
        title="Notification Preferences"
        open={preferenceOpen}
        width={420}
        onClose={() => setPreferenceOpen(false)}
        extra={
          <Button
            type="primary"
            onClick={handleSavePreference}
            loading={updatePreferenceMutation.isLoading}
          >
            Save
          </Button>
        }
      >
        <Form form={preferenceForm} layout="vertical">
          <Form.Item label="Channels">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <Text style={{ width: 80 }}>Inbox</Text>
                <Form.Item
                  name={["channels", "inbox"]}
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </Space>
              <Space>
                <Text style={{ width: 80 }}>Email</Text>
                <Form.Item
                  name={["channels", "email"]}
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </Space>
              <Space>
                <Text style={{ width: 80 }}>SMS</Text>
                <Form.Item
                  name={["channels", "sms"]}
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </Space>
              <Space>
                <Text style={{ width: 80 }}>WeChat</Text>
                <Form.Item
                  name={["channels", "wechat"]}
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </Space>
            </Space>
          </Form.Item>

          <Form.Item name="muteCategories" label="Mute Categories">
            <Select
              mode="multiple"
              options={[
                { label: "System", value: "system" },
                { label: "Task", value: "task" },
                { label: "Ticket", value: "ticket" },
                { label: "Bill", value: "bill" },
                { label: "Renewal", value: "renewal" },
                { label: "AI", value: "ai" },
              ]}
            />
          </Form.Item>

          <Form.Item name="digestTime" label="Digest Time">
            <TimePicker format="HH:mm" minuteStep={15} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
