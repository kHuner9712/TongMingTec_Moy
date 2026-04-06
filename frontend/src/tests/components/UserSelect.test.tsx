import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSelect from '../../components/UserSelect';
import { useQuery } from 'react-query';

vi.mock('react-query');

const mockUsers = [
  { id: '1', displayName: '张三', username: 'zhangsan', status: 'active' },
  { id: '2', displayName: '李四', username: 'lisi', status: 'active' },
  { id: '3', displayName: '王五', username: 'wangwu', status: 'active' },
];

describe('UserSelect', () => {
  it('渲染选择器并显示加载状态', () => {
    (useQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<UserSelect />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('加载完成后显示用户选项', async () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockUsers },
      isLoading: false,
    });

    render(<UserSelect placeholder="选择用户" />);
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('王五')).toBeInTheDocument();
  });

  it('支持搜索过滤', async () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockUsers },
      isLoading: false,
    });

    render(<UserSelect />);
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    const input = screen.getByRole('combobox');
    await userEvent.type(input, '张');
    
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  it('调用 onChange 回调', async () => {
    const handleChange = vi.fn();
    (useQuery as any).mockReturnValue({
      data: { items: mockUsers },
      isLoading: false,
    });

    render(<UserSelect onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    
    const option = screen.getByText('张三');
    await userEvent.click(option);
    
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('显示已选中的值', () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockUsers },
      isLoading: false,
    });

    render(<UserSelect value="1" />);
    expect(screen.getByText('张三')).toBeInTheDocument();
  });

  it('禁用状态下不可选择', () => {
    (useQuery as any).mockReturnValue({
      data: { items: mockUsers },
      isLoading: false,
    });

    render(<UserSelect disabled />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('disabled');
  });
});
