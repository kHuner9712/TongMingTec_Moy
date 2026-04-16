import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { csmApi } from '../services/csm';
import { deliveryApi } from '../services/delivery';
import {
  CustomerHealthScore,
  DeliveryAcceptanceResult,
  DeliveryOutcomeStatus,
  DeliveryRiskSeverity,
  DeliveryStatus,
  HealthLevel,
  SuccessPlanStatus,
} from '../types';
import { usePermission } from '../hooks/usePermission';

const { Text } = Typography;

const HEALTH_LEVEL_CONFIG: Record<HealthLevel, { text: string; color: string }> = {
  high: { text: '健康', color: 'green' },
  medium: { text: '一般', color: 'blue' },
  low: { text: '偏低', color: 'orange' },
  critical: { text: '风险', color: 'red' },
};

const PLAN_STATUS_CONFIG: Record<SuccessPlanStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  active: { text: '执行中', color: 'blue' },
  on_hold: { text: '暂停', color: 'orange' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

const DELIVERY_STATUS_TEXT: Record<DeliveryStatus, string> = {
  draft: '草稿',
  active: '进行中',
  blocked: '阻塞',
  ready_for_acceptance: '待验收',
  accepted: '已验收',
  closed: '已关闭',
};

const ACCEPTANCE_TEXT: Record<DeliveryAcceptanceResult, string> = {
  pending: '待验收',
  accepted: '验收通过',
  rejected: '验收驳回',
};

const RISK_COLOR: Record<DeliveryRiskSeverity, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
};

const OUTCOME_TEXT: Record<DeliveryOutcomeStatus, string> = {
  pending: '待测量',
  achieved: '达成',
  partial: '部分达成',
  not_achieved: '未达成',
};

export default function CustomerHealth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [levelFilter, setLevelFilter] = useState<HealthLevel | undefined>();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(
    searchParams.get('customerId') || undefined,
  );

  const { data, isLoading } = useQuery(
    ['csm-health', page, pageSize, levelFilter],
    () =>
      csmApi.listHealthScores({
        page,
        page_size: pageSize,
        level: levelFilter,
      }),
  );

  useEffect(() => {
    const fromUrl = searchParams.get('customerId') || undefined;
    if (fromUrl) {
      setSelectedCustomerId(fromUrl);
      return;
    }

    if (!selectedCustomerId && data?.items?.length) {
      setSelectedCustomerId(data.items[0].customerId);
    }
  }, [data?.items, searchParams, selectedCustomerId]);

  const { data: healthDetail } = useQuery(
    ['csm-health-detail', selectedCustomerId],
    () => csmApi.getHealthScore(selectedCustomerId || ''),
    { enabled: !!selectedCustomerId },
  );

  const { data: deliverySummary } = useQuery(
    ['csm-health-delivery-summary', selectedCustomerId],
    () => deliveryApi.getCustomerSummary(selectedCustomerId || ''),
    { enabled: !!selectedCustomerId },
  );

  const { data: deliveries } = useQuery(
    ['csm-health-deliveries', selectedCustomerId],
    () =>
      deliveryApi.list({
        customerId: selectedCustomerId,
        page: 1,
        page_size: 5,
      }),
    { enabled: !!selectedCustomerId },
  );

  const latestDeliveryId = deliveries?.items?.[0]?.id;

  const { data: latestDeliveryDetail } = useQuery(
    ['csm-health-latest-delivery-detail', latestDeliveryId],
    () => deliveryApi.get(latestDeliveryId || ''),
    { enabled: !!latestDeliveryId },
  );

  const { data: successPlans } = useQuery(
    ['csm-health-plans', selectedCustomerId],
    () =>
      csmApi.listSuccessPlans({
        customerId: selectedCustomerId,
        page: 1,
        page_size: 5,
      }),
    { enabled: !!selectedCustomerId },
  );

  const { data: returnVisits } = useQuery(
    ['csm-health-visits', selectedCustomerId],
    () => csmApi.listReturnVisits(selectedCustomerId || '', { page: 1, page_size: 5 }),
    { enabled: !!selectedCustomerId },
  );

  const evaluateMutation = useMutation(
    (customerId: string) => csmApi.evaluateHealth(customerId),
    {
      onSuccess: () => {
        message.success('健康度已重新评估');
        queryClient.invalidateQueries(['csm-health']);
        queryClient.invalidateQueries(['csm-health-detail', selectedCustomerId]);
      },
      onError: () => {
        message.error('重新评估失败');
      },
    },
  );

  const latestAcceptance = latestDeliveryDetail?.acceptances?.[0];
  const openRisks = (latestDeliveryDetail?.risks || []).filter(
    (risk) => risk.status === 'open' || risk.status === 'mitigated',
  );

  const outcomeStats = useMemo(() => {
    const base: Record<DeliveryOutcomeStatus, number> = {
      pending: 0,
      achieved: 0,
      partial: 0,
      not_achieved: 0,
    };

    (latestDeliveryDetail?.outcomes || []).forEach((item) => {
      base[item.status] += 1;
    });

    return base;
  }, [latestDeliveryDetail?.outcomes]);

  const autoRiskSignals = useMemo(() => {
    const raw = healthDetail?.factors?.autoRiskSignals;
    if (!Array.isArray(raw)) return [] as Array<Record<string, unknown>>;
    return raw.slice(0, 6) as Array<Record<string, unknown>>;
  }, [healthDetail?.factors]);

  const columns = [
    {
      title: '客户ID',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (value: string) => value.slice(0, 8),
    },
    {
      title: '健康分',
      dataIndex: 'score',
      key: 'score',
      render: (value: number) => value.toFixed(0),
    },
    {
      title: '健康等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: HealthLevel) => (
        <Tag color={HEALTH_LEVEL_CONFIG[level]?.color}>{HEALTH_LEVEL_CONFIG[level]?.text || level}</Tag>
      ),
    },
    {
      title: '最近评估时间',
      dataIndex: 'evaluatedAt',
      key: 'evaluatedAt',
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_: unknown, record: CustomerHealthScore) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => {
              setSelectedCustomerId(record.customerId);
              navigate(`/workbench/csm/health?customerId=${record.customerId}`);
            }}
          >
            打开工作台
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/workbench/csm/plans?customerId=${record.customerId}`)}
          >
            SuccessPlan
          </Button>
          {can('PERM-CSM-MANAGE') && (
            <Button
              size="small"
              type="link"
              loading={evaluateMutation.isLoading}
              onClick={() => evaluateMutation.mutate(record.customerId)}
            >
              重新评估
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap>
          <Select
            placeholder="健康等级筛选"
            allowClear
            style={{ width: 160 }}
            value={levelFilter}
            onChange={(value) => {
              setLevelFilter(value);
              setPage(1);
            }}
          >
            {Object.entries(HEALTH_LEVEL_CONFIG).map(([key, config]) => (
              <Select.Option key={key} value={key}>
                {config.text}
              </Select.Option>
            ))}
          </Select>
          <Text type="secondary">点击任意客户即可查看交付结果、成功计划与回访联动视图</Text>
        </Space>
        <Button onClick={() => navigate('/workbench/csm/visits')}>查看回访台账</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.items || []}
        loading={isLoading}
        onRow={(record: CustomerHealthScore) => ({
          onClick: () => {
            setSelectedCustomerId(record.customerId);
            navigate(`/workbench/csm/health?customerId=${record.customerId}`);
          },
        })}
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

      {selectedCustomerId && (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="健康分"
                  value={healthDetail?.score || 0}
                  suffix={
                    healthDetail ? (
                      <Tag color={HEALTH_LEVEL_CONFIG[healthDetail.level]?.color}>
                        {HEALTH_LEVEL_CONFIG[healthDetail.level]?.text}
                      </Tag>
                    ) : undefined
                  }
                />
                <Text type="secondary">
                  最近评估：
                  {healthDetail?.evaluatedAt
                    ? dayjs(healthDetail.evaluatedAt).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card>
                <Statistic title="最近交付状态" value={latestDeliveryId ? DELIVERY_STATUS_TEXT[deliveries?.items?.[0].status as DeliveryStatus] : '-'} />
                <Text type="secondary">
                  验收：
                  {latestAcceptance ? ACCEPTANCE_TEXT[latestAcceptance.result] : '暂无'}
                </Text>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card>
                <Statistic title="结果达成（累计）" value={deliverySummary?.achievedOutcomes || 0} />
                <Text type="secondary">
                  部分达成 {deliverySummary?.partialOutcomes || 0} / 待处理风险{' '}
                  {deliverySummary?.pendingRisks || 0}
                </Text>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} lg={14}>
              <Card
                title="DLV 交付结果透视"
                extra={
                  latestDeliveryId ? (
                    <Button size="small" onClick={() => navigate(`/deliveries/${latestDeliveryId}`)}>
                      查看交付详情
                    </Button>
                  ) : null
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space wrap>
                    <Tag color="blue">总交付 {deliverySummary?.totalDeliveries || 0}</Tag>
                    <Tag>进行中 {deliverySummary?.activeDeliveries || 0}</Tag>
                    <Tag color="orange">阻塞 {deliverySummary?.blockedDeliveries || 0}</Tag>
                    <Tag color="green">验收通过 {deliverySummary?.acceptedDeliveries || 0}</Tag>
                  </Space>

                  <div>
                    <Text strong>风险摘要：</Text>
                    {openRisks.length === 0 ? (
                      <Text type="secondary"> 无进行中风险</Text>
                    ) : (
                      <Space wrap style={{ marginLeft: 8 }}>
                        {openRisks.slice(0, 6).map((risk) => (
                          <Tag key={risk.id} color={RISK_COLOR[risk.severity]}>
                            {risk.title}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </div>

                  <div>
                    <Text strong>结果达成情况：</Text>
                    <Space wrap style={{ marginLeft: 8 }}>
                      {Object.entries(outcomeStats).map(([key, count]) => (
                        <Tag key={key}>
                          {OUTCOME_TEXT[key as DeliveryOutcomeStatus]} {count}
                        </Tag>
                      ))}
                    </Space>
                  </div>

                  <div>
                    <Text strong>AUTO 风险信号：</Text>
                    {autoRiskSignals.length === 0 ? (
                      <Text type="secondary"> 暂无自动化写入风险信号</Text>
                    ) : (
                      <Space wrap style={{ marginLeft: 8 }}>
                        {autoRiskSignals.map((signal, index) => (
                          <Tag
                            key={`${String(signal.relatedId || signal.title || index)}-${index}`}
                            color={RISK_COLOR[(signal.severity as DeliveryRiskSeverity) || 'medium']}
                          >
                            {String(signal.title || '风险信号')}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card
                title="SuccessPlan 摘要"
                extra={
                  <Button size="small" onClick={() => navigate(`/workbench/csm/plans?customerId=${selectedCustomerId}`)}>
                    查看全部
                  </Button>
                }
              >
                <List
                  size="small"
                  dataSource={successPlans?.items || []}
                  locale={{ emptyText: '暂无 SuccessPlan' }}
                  renderItem={(plan) => (
                    <List.Item
                      actions={[
                        <Button
                          key="detail"
                          size="small"
                          type="link"
                          onClick={() => navigate(`/workbench/csm/plans/${plan.id}`)}
                        >
                          详情
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text>{plan.title}</Text>
                            <Tag color={PLAN_STATUS_CONFIG[plan.status]?.color}>
                              {PLAN_STATUS_CONFIG[plan.status]?.text}
                            </Tag>
                          </Space>
                        }
                        description={dayjs(plan.updatedAt).format('YYYY-MM-DD HH:mm')}
                      />
                    </List.Item>
                  )}
                />
              </Card>

              <Card
                title="最近回访记录"
                style={{ marginTop: 16 }}
                extra={
                  <Button
                    size="small"
                    onClick={() => navigate(`/workbench/csm/visits?customerId=${selectedCustomerId}`)}
                  >
                    查看全部
                  </Button>
                }
              >
                <List
                  size="small"
                  dataSource={returnVisits?.items || []}
                  locale={{ emptyText: '暂无回访记录' }}
                  renderItem={(visit) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag>{visit.visitType}</Tag>
                            <Text type="secondary">{dayjs(visit.createdAt).format('MM-DD HH:mm')}</Text>
                          </Space>
                        }
                        description={visit.summary}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
