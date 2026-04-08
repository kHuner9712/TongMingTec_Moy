import { vi } from 'vitest';
import type { Customer, User, Lead, Opportunity, Ticket, Conversation } from '../../types';

export interface MockQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

export type MockUseQuery = ReturnType<typeof vi.fn>;

export function createMockUseQuery<T>(result: Partial<MockQueryResult<T>>): MockUseQuery {
  const defaultResult: MockQueryResult<T> = {
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    refetch: vi.fn(),
  };
  return vi.fn().mockReturnValue({ ...defaultResult, ...result });
}

export interface MockApiFunction<T = unknown> {
  mockResolvedValue: (value: T) => void;
  mockRejectedValue: (error: Error) => void;
  mockResolvedValueOnce: (value: T) => void;
}

export function createMockApiFunction<T = unknown>(): MockApiFunction<T> {
  const mockFn = vi.fn();
  return {
    mockResolvedValue: (value: T) => mockFn.mockResolvedValue(value),
    mockRejectedValue: (error: Error) => mockFn.mockRejectedValue(error),
    mockResolvedValueOnce: (value: T) => mockFn.mockResolvedValueOnce(value),
  };
}

export interface MockPaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
  };
}

export function createMockPaginatedResponse<T>(
  items: T[],
  options: Partial<MockPaginatedResponse<T>['meta']> = {}
): MockPaginatedResponse<T> {
  return {
    items,
    meta: {
      page: 1,
      page_size: 10,
      total: items.length,
      total_pages: 1,
      has_next: false,
      ...options,
    },
  };
}

export const mockCustomers: Customer[] = [
  {
    id: 'customer-1',
    orgId: 'org-1',
    name: '测试公司A',
    industry: 'IT',
    level: 'L1',
    ownerUserId: 'user-1',
    status: 'active',
    phone: '13800138001',
    email: 'a@test.com',
    address: null,
    remark: null,
    lastContactAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
  {
    id: 'customer-2',
    orgId: 'org-1',
    name: '测试公司B',
    industry: '金融',
    level: 'L2',
    ownerUserId: 'user-1',
    status: 'active',
    phone: '13800138002',
    email: 'b@test.com',
    address: null,
    remark: null,
    lastContactAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'zhangsan',
    displayName: '张三',
    email: 'zhangsan@test.com',
    mobile: '13800138001',
    status: 'active',
    orgId: 'org-1',
    departmentId: 'dept-1',
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
    lastLoginAt: '2024-01-01T00:00:00Z',
    roles: ['admin'],
    permissions: ['*'],
    dataScope: 'all',
  },
  {
    id: 'user-2',
    username: 'lisi',
    displayName: '李四',
    email: 'lisi@test.com',
    mobile: '13800138002',
    status: 'active',
    orgId: 'org-1',
    departmentId: 'dept-1',
    locale: 'zh-CN',
    timezone: 'Asia/Shanghai',
    lastLoginAt: '2024-01-01T00:00:00Z',
    roles: ['user'],
    permissions: ['customer:read', 'lead:read'],
    dataScope: 'department',
  },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    orgId: 'org-1',
    source: 'manual',
    name: '测试线索A',
    mobile: '13900139001',
    email: 'lead-a@test.com',
    companyName: '测试公司A',
    ownerUserId: 'user-1',
    status: 'new',
    score: 80,
    scoreReason: '高意向客户',
    lastFollowUpAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
];

export const mockOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    orgId: 'org-1',
    customerId: 'customer-1',
    leadId: null,
    ownerUserId: 'user-1',
    name: '测试商机A',
    amount: 100000,
    currency: 'CNY',
    stage: 'discovery',
    result: null,
    expectedCloseDate: '2024-06-30',
    pauseReason: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
];

export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    orgId: 'org-1',
    conversationId: null,
    customerId: 'customer-1',
    ticketNo: 'TK-001',
    title: '测试工单A',
    priority: 'normal',
    status: 'pending',
    assigneeUserId: 'user-1',
    solution: null,
    closedReason: null,
    slaDueAt: null,
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    orgId: 'org-1',
    channelId: 'channel-1',
    customerId: 'customer-1',
    subject: null,
    assigneeUserId: 'user-1',
    status: 'active',
    firstResponseAt: null,
    lastMessageAt: null,
    closedAt: null,
    closedReason: null,
    ratingScore: null,
    ratingComment: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  },
];

export interface MockAuthState {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  isAuthenticated: boolean;
}

export function createMockAuthState(overrides: Partial<MockAuthState> = {}): MockAuthState {
  return {
    user: mockUsers[0],
    tokens: {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    },
    isAuthenticated: true,
    ...overrides,
  };
}
