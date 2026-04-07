import { vi } from 'vitest';
import { UseQueryResult } from 'react-query';

export type MockUseQuery = ReturnType<typeof vi.fn<() => UseQueryResult<unknown, Error>>>;

export interface MockQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function createMockUseQuery<T>(result: MockQueryResult<T>): MockUseQuery {
  return vi.fn().mockReturnValue(result);
}

export interface MockApiFunction {
  mockResolvedValue: (value: unknown) => void;
  mockRejectedValue: (value: unknown) => void;
}

export function createMockApiFunction(): MockApiFunction {
  return {
    mockResolvedValue: vi.fn(),
    mockRejectedValue: vi.fn(),
  };
}
