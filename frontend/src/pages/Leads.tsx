import { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Descriptions,
  Drawer,
  Timeline,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { leadApi, FollowUpDto } from "../services/lead";
import { usePermission } from "../hooks/usePermission";
import { Lead, LeadStatus, CreateLeadDto, LeadFollowUp } from "../types";
import UserSelect from "../components/UserSelect";
import dayjs from "dayjs";

const STATUS_CONFIG: Record<LeadStatus, { color: string; text: string }> = {
  new: { color: "blue", text: "新线索" },
  assigned: { color: "cyan", text: "已分配" },
  following: { color: "green", text: "跟进中" },
  converted: { color: "purple", text: "已转化" },
  invalid: { color: "red", text: "无效" },
};

const FOLLOW_TYPE_CONFIG: Record<string, string> = {
  call: "电话",
  wechat: "微信",
  email: "邮件",
  meeting: "会议",
  manual: "手动",
};

export default function Leads() {
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [followUpForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ["leads", page, pageSize, statusFilter],
    () => leadApi.list({ page, page_size: pageSize, status: statusFilter }),
    { keepPreviousData: true },
  );

  const { data: leadDetail, refetch: refetchLeadDetail } = useQuery(
    ["lead", selectedLead?.id],
    () => leadApi.get(selectedLead!.id),
    { enabled: !!selectedLead && isDetailDrawerOpen },
  );

  const createMutation = useMutation(leadApi.create, {
    onSuccess: () => {
      message.success("创建成功");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries(["leads"]);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      message.error(err?.message || "创建失败");
    },
  });

  const assignMutation = useMutation(
    (data: { id: string; ownerUserId: string; version: number }) =>
      leadApi.assign(data.id, data.ownerUserId, data.version),
    {
      onSuccess: () => {
        message.success("分配成功");
        setIsAssignModalOpen(false);
        assignForm.resetFields();
        queryClient.invalidateQueries(["leads"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "分配失败");
      },
    },
  );

  const followUpMutation = useMutation(
    (data: { id: string; data: FollowUpDto }) =>
      leadApi.addFollowUp(data.id, data.data),
    {
      onSuccess: () => {
        message.success("跟进记录已添加");
        setIsFollowUpModalOpen(false);
        followUpForm.resetFields();
        queryClient.invalidateQueries(["leads"]);
        if (selectedLead) {
          refetchLeadDetail();
        }
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "添加失败");
      },
    },
  );

  const convertMutation = useMutation(
    (data: { id: string; version: number }) =>
      leadApi.convert(data.id, data.version),
    {
      onSuccess: () => {
        message.success("转化成功，已创建客户和商机");
        setIsConvertModalOpen(false);
        queryClient.invalidateQueries(["leads"]);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || "转化失败");
      },
    },
  );

  const handleCreate = () => {
    createForm.validateFields().then((values) => {
      createMutation.mutate(values as CreateLeadDto);
    });
  };

  const handleAssign = () => {
    assignForm.validateFields().then((values) => {
      if (selectedLead) {
        assignMutation.mutate({
          id: selectedLead.id,
          ownerUserId: values.ownerUserId,
          version: selectedLead.version,
        });
      }
    });
  };

  const handleFollowUp = () => {
    followUpForm.validateFields().then((values) => {
      if (selectedLead) {
        followUpMutation.mutate({
          id: selectedLead.id,
          data: {
            content: values.content,
            followType: values.followType,
            nextActionAt: values.nextActionAt?.toISOString(),
            version: selectedLead.version,
          },
        });
      }
    });
  };

  const handleConvert = () => {
    if (selectedLead) {
      convertMutation.mutate({
        id: selectedLead.id,
        version: selectedLead.version,
      });
    }
  };

  const openDetailDrawer = (record: Lead) => {
    setSelectedLead(record);
    setIsDetailDrawerOpen(true);
  };

  const openAssignModal = (record: Lead) => {
    setSelectedLead(record);
    assignForm.setFieldsValue({ ownerUserId: record.ownerUserId });
    setIsAssignModalOpen(true);
  };

  const openFollowUpModal = (record: Lead) => {
    setSelectedLead(record);
    followUpForm.resetFields();
    setIsFollowUpModalOpen(true);
  };

  const openConvertModal = (record: Lead) => {
    setSelectedLead(record);
    setIsConvertModalOpen(true);
  };

  const columns = [
    { title: "姓名", dataIndex: "name", key: "name" },
    { title: "手机", dataIndex: "mobile", key: "mobile" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    { title: "公司", dataIndex: "companyName", key: "companyName" },
    { title: "来源", dataIndex: "source", key: "source" },
    { title: "负责人", dataIndex: "ownerUserName", key: "ownerUserName" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: LeadStatus) => (
        <Tag color={STATUS_CONFIG[v]?.color}>{STATUS_CONFIG[v]?.text || v}</Tag>
      ),
    },
    { title: "评分", dataIndex: "score", key: "score" },
    {
      title: "操作",
      key: "action",
      width: 280,
      render: (_: unknown, record: Lead) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetailDrawer(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserSwitchOutlined />}
            onClick={() => openAssignModal(record)}
            disabled={!can("PERM-LM-ASSIGN")}
          >
            分配
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => openFollowUpModal(record)}
            disabled={!can("PERM-LM-FOLLOW_UP")}
          >
            跟进
          </Button>
          {record.status === "following" && (
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => openConvertModal(record)}
              disabled={!can("PERM-LM-CONVERT")}
            >
              转化
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Space>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(STATUS_CONFIG).map(([key, { text }]) => (
              <Select.Option key={key} value={key}>
                {text}
              </Select.Option>
            ))}
          </Select>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!can("PERM-LM-CREATE")}
        >
          新建线索
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.items || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="新建线索"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsCreateModalOpen(false)}
        confirmLoading={createMutation.isLoading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="mobile" label="手机">
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="companyName" label="公司">
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select allowClear>
              <Select.Option value="manual">手动录入</Select.Option>
              <Select.Option value="web">官网</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="referral">转介绍</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配线索"
        open={isAssignModalOpen}
        onOk={handleAssign}
        onCancel={() => setIsAssignModalOpen(false)}
        confirmLoading={assignMutation.isLoading}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="ownerUserId"
            label="负责人"
            rules={[{ required: true, message: "请选择负责人" }]}
          >
            <UserSelect placeholder="选择负责人" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加跟进记录"
        open={isFollowUpModalOpen}
        onOk={handleFollowUp}
        onCancel={() => setIsFollowUpModalOpen(false)}
        confirmLoading={followUpMutation.isLoading}
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item name="followType" label="跟进方式">
            <Select allowClear>
              {Object.entries(FOLLOW_TYPE_CONFIG).map(([key, text]) => (
                <Select.Option key={key} value={key}>
                  {text}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: "请输入跟进内容" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="nextActionAt" label="下次跟进时间">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="转化为客户和商机"
        open={isConvertModalOpen}
        onOk={handleConvert}
        onCancel={() => setIsConvertModalOpen(false)}
        confirmLoading={convertMutation.isLoading}
      >
        <p>确定要将此线索转化为客户和商机吗？</p>
        <p>转化后将自动创建客户记录和商机记录。</p>
      </Modal>

      <Drawer
        title="线索详情"
        placement="right"
        width={700}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {leadDetail && (
          <div>
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="姓名">
                  {leadDetail.name}
                </Descriptions.Item>
                <Descriptions.Item label="手机">
                  {leadDetail.mobile || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {leadDetail.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="公司">
                  {leadDetail.companyName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="来源">
                  {leadDetail.source || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag
                    color={
                      STATUS_CONFIG[leadDetail.status as LeadStatus]?.color
                    }
                  >
                    {STATUS_CONFIG[leadDetail.status as LeadStatus]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="评分">
                  {leadDetail.score || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="负责人">
                  {leadDetail.ownerUserName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(leadDetail.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                </Descriptions.Item>
                <Descriptions.Item label="最后跟进">
                  {leadDetail.lastFollowUpAt
                    ? dayjs(leadDetail.lastFollowUpAt).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="跟进记录">
              {leadDetail.followUps && leadDetail.followUps.length > 0 ? (
                <Timeline
                  items={leadDetail.followUps.map((item: LeadFollowUp) => ({
                    color: "blue",
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {FOLLOW_TYPE_CONFIG[item.followType || "manual"] ||
                            "跟进"}{" "}
                          - {dayjs(item.createdAt).format("YYYY-MM-DD HH:mm")}
                        </div>
                        <div>{item.content}</div>
                        {item.nextActionAt && (
                          <div style={{ color: "#999", fontSize: 12 }}>
                            下次跟进:{" "}
                            {dayjs(item.nextActionAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div
                  style={{ color: "#999", textAlign: "center", padding: 20 }}
                >
                  暂无跟进记录
                </div>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
