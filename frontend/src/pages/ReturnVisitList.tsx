import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { csmApi } from '../services/csm';
import { CustomerReturnVisit } from '../types';
import { usePermission } from '../hooks/usePermission';
import CustomerSelect from '../components/CustomerSelect';

const { Text } = Typography;

const VISIT_TYPE_OPTIONS = [
  { value: 'quarterly_review', label: '季度复盘' },
  { value: 'delivery_retro', label: '交付复盘' },
  { value: 'renewal_check', label: '续约摸底' },
  { value: 'risk_followup', label: '风险跟进' },
];

export default function ReturnVisitList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [customerIdFilter, setCustomerIdFilter] = useState<string | undefined>(
    searchParams.get('customerId') || undefined,
  );
  const [visitTypeFilter, setVisitTypeFilter] = useState<string | undefined>();
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('create') === '1');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createForm] = Form.useForm();

  const { data, isLoading } = useQuery(
    ['csm-visits', page, pageSize, customerIdFilter, visitTypeFilter],
    () =>
      csmApi.listReturnVisitsGlobal({
        page,
        page_size: pageSize,
        customerId: customerIdFilter,
        visitType: visitTypeFilter,
      }),
  );

  const { data: visitDetail, isLoading: detailLoading } = useQuery(
    ['csm-visit-detail', detailId],
    () => csmApi.getReturnVisit(detailId || ''),
    { enabled: !!detailId },
  );

  const createMutation = useMutation(
    (payload: { customerId: string; visitType: string; summary: string; nextVisitAt?: string }) =>
      csmApi.createReturnVisit(payload),
    {
      onSuccess: () => {
        message.success('回访记录已创建');
        setIsCreateOpen(false);
        createForm.resetFields();
        queryClient.invalidateQueries(['csm-visits']);
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        message.error(err?.message || '创建失败');
      },
    },
  );

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const columns = [
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (value: string) => value.slice(0, 8),
    },
    {
      title: '回访类型',
      dataIndex: 'visitType',
      key: 'visitType',
      render: (value: string) => {
        const matched = VISIT_TYPE_OPTIONS.find((option) => option.value === value);
        return <Tag>{matched?.label || value}</Tag>;
      },
    },
    {
      title: '回访摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: '下次回访',
      dataIndex: 'nextVisitAt',
      key: 'nextVisitAt',
      render: (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '记录时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: CustomerReturnVisit) => (
        <Space>
          <Button size="small" type="link" onClick={() => setDetailId(record.id)}>
            查看
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/workbench/csm/health?customerId=${record.customerId}`)}
          >
            健康档案
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/workbench/csm/plans?customerId=${record.customerId}`)}
          >
            SuccessPlan
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={4}>
          <Text strong>ReturnVisit 台账</Text>
          <Text type="secondary">
            回访记录与 SuccessPlan、交付结果、健康评分联动，支撑成交后的持续经营闭环。
          </Text>
        </Space>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <CustomerSelect
            value={customerIdFilter}
            onChange={(value) => {
              setCustomerIdFilter(value);
              setPage(1);
            }}
            style={{ width: 260 }}
            placeholder="按客户筛选"
          />
          <Select
            allowClear
            placeholder="按回访类型筛选"
            style={{ width: 220 }}
            value={visitTypeFilter}
            onChange={(value) => {
              setVisitTypeFilter(value);
              setPage(1);
            }}
            options={VISIT_TYPE_OPTIONS}
          />
        </Space>

        <Space>
          <Button onClick={() => navigate('/workbench/csm/plans')}>查看 SuccessPlan</Button>
          <Button
            type="primary"
            onClick={() => {
              createForm.setFieldsValue({ customerId: customerIdFilter, visitType: 'quarterly_review' });
              setIsCreateOpen(true);
            }}
            disabled={!can('PERM-CSM-MANAGE')}
          >
            新增回访
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total || 0,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          },
        }}
      />

      <Modal
        title="新增回访记录"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isLoading}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values: {
            customerId: string;
            visitType: string;
            summary: string;
            nextVisitAt?: dayjs.Dayjs;
          }) => {
            createMutation.mutate({
              customerId: values.customerId,
              visitType: values.visitType,
              summary: values.summary,
              nextVisitAt: values.nextVisitAt ? values.nextVisitAt.toISOString() : undefined,
            });
          }}
        >
          <Form.Item
            name="customerId"
            label="客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <CustomerSelect allowClear={false} />
          </Form.Item>
          <Form.Item
            name="visitType"
            label="回访类型"
            rules={[{ required: true, message: '请选择回访类型' }]}
          >
            <Select options={VISIT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="summary"
            label="回访摘要"
            rules={[{ required: true, message: '请输入回访摘要' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="nextVisitAt" label="下次回访时间（可选）">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="回访详情"
        width={560}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      >
        {detailLoading ? (
          <Text type="secondary">加载中...</Text>
        ) : (
          visitDetail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="回访ID">{visitDetail.id}</Descriptions.Item>
            <Descriptions.Item label="客户ID">{visitDetail.customerId}</Descriptions.Item>
            <Descriptions.Item label="回访类型">
              {VISIT_TYPE_OPTIONS.find((option) => option.value === visitDetail.visitType)?.label ||
                visitDetail.visitType}
            </Descriptions.Item>
            <Descriptions.Item label="记录时间">
              {dayjs(visitDetail.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="下次回访">
              {visitDetail.nextVisitAt ? dayjs(visitDetail.nextVisitAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="摘要">{visitDetail.summary}</Descriptions.Item>
          </Descriptions>
          )
        )}
      </Drawer>
    </div>
  );
}
