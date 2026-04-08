import {
  useQuery as useRqQuery,
  useMutation as useRqMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from 'react-query';
import { AxiosError } from 'axios';
import { message } from 'antd';

type QueryKey = string | unknown[];

export function useAppQuery<TData, TError = AxiosError>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
) {
  return useRqQuery<TData, TError>(queryKey, queryFn, {
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}

export function useAppMutation<TData, TVariables, TError = AxiosError>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables>,
    'mutationFn'
  > & {
    successMessage?: string;
    invalidateKeys?: QueryKey[];
  },
) {
  const queryClient = useQueryClient();
  const { successMessage, invalidateKeys, ...mutationOptions } = options || {};

  return useRqMutation<TData, TError, TVariables>(mutationFn, {
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        message.success(successMessage);
      }
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries(key);
        });
      }
      mutationOptions.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const msg =
        (error as AxiosError<{ message?: string }>)?.response?.data
          ?.message ||
        (error as Error)?.message ||
        '操作失败';
      message.error(msg);
      mutationOptions.onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}

export { useQueryClient };
